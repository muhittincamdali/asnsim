import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import { afterEach, describe, expect, it } from 'vitest';
import { decodeJws } from '../../src/jws/jws.js';
import { containsJson, runScenario, sendAll, sendNotification } from '../../src/run/run.js';
import { loadScenario, parseScenario } from '../../src/scenario/load.js';
import { DEFAULT_APP, initWorkspace, loadWorkspace } from '../../src/workspace.js';
import { scratchDir } from '../helpers/scratch.js';
import { type Handler, reply, startServer } from '../helpers/server.js';

const dir = scratchDir('run');
initWorkspace(dir, DEFAULT_APP);
const workspace = loadWorkspace(dir);
const verifier = new SignedDataVerifier(
  [Buffer.from(workspace.chain.root)],
  false,
  Environment.SANDBOX,
  DEFAULT_APP.bundleId,
);

const servers: { close: () => Promise<void> }[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});
async function server(handler: Handler) {
  const started = await startServer(handler);
  servers.push(started);
  return started;
}

/** A webhook that verifies like a real backend and keeps an entitlement per original transaction. */
function backend(options: { revokeOnRefund?: boolean; failDuplicates?: boolean } = {}) {
  const active = new Map<string, boolean>();
  const seen = new Set<string>();
  const handler: Handler = async (request, response) => {
    if (request.method === 'GET') {
      const id = request.url.split('/').pop() ?? '';
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ active: active.get(id) ?? false }));
      return;
    }
    try {
      const { signedPayload } = JSON.parse(request.body);
      const notification = await verifier.verifyAndDecodeNotification(signedPayload);
      if (seen.has(notification.notificationUUID ?? '') && options.failDuplicates) {
        response.writeHead(500).end('duplicate key');
        return;
      }
      seen.add(notification.notificationUUID ?? '');
      const signed = notification.data?.signedTransactionInfo;
      if (signed) {
        const transaction = await verifier.verifyAndDecodeTransaction(signed);
        const id = transaction.originalTransactionId ?? '';
        const type = notification.notificationType;
        if (type === 'SUBSCRIBED' || type === 'DID_RENEW') active.set(id, true);
        if (type === 'EXPIRED') active.set(id, false);
        if (type === 'REFUND' && options.revokeOnRefund !== false) active.set(id, false);
      }
      response.writeHead(200).end();
    } catch {
      response.writeHead(400).end('verification failed');
    }
  };
  return handler;
}

describe('runScenario', () => {
  it('delivers each built-in scenario to a webhook that verifies with Apple’s library', async () => {
    const webhook = await server(backend());
    for (const name of [
      'trial-renew-refund',
      'billing-retry-grace-recovery',
      'consumable-refund-dispute',
      'upgrade-downgrade',
    ]) {
      const result = await runScenario(loadScenario(name), {
        workspace,
        url: `${webhook.url}/asn`,
      });
      expect(result.ok, name).toBe(true);
      expect(result.clock).toBe('live');
    }
    const first = JSON.parse(webhook.received[0]?.body ?? '');
    expect(Object.keys(first)).toEqual(['signedPayload']);
    expect(webhook.received[0]?.headers['content-type']).toBe('application/json');
    expect(webhook.received[0]?.headers['user-agent']).toMatch(/^asnsim\//);
  });

  it('dates each notification now in live mode and keeps the scenario’s dates in fixed mode', async () => {
    const webhook = await server(reply(200));
    const scenario = loadScenario('trial-renew-refund');
    const before = Date.now();
    const live = await runScenario(scenario, { workspace, url: webhook.url });
    for (const step of live.steps) {
      expect(Date.parse(step.signedDate)).toBeGreaterThanOrEqual(before - 5);
      expect(Date.parse(step.signedDate)).toBeLessThanOrEqual(Date.now() + 5);
    }
    // The renewal is dated now, and its period still ends one month later.
    const renewal = decodeJws(JSON.parse(webhook.received[1]?.body ?? '').signedPayload)
      .payload as { data: { signedTransactionInfo: string }; signedDate: number };
    const transaction = decodeJws(renewal.data.signedTransactionInfo).payload as {
      purchaseDate: number;
      expiresDate: number;
    };
    expect(transaction.purchaseDate).toBe(renewal.signedDate);
    expect(transaction.expiresDate - transaction.purchaseDate).toBeGreaterThan(27 * 86_400_000);

    const fixed = await runScenario(scenario, {
      workspace,
      url: webhook.url,
      start: new Date('2026-10-01T09:00:00Z'),
    });
    expect(fixed.clock).toBe('fixed');
    expect(fixed.steps.map((step) => step.signedDate)).toEqual([
      '2026-10-01T09:00:00.000Z',
      '2026-10-08T09:00:00.000Z',
      '2026-10-11T09:00:00.000Z',
    ]);
  });

  it('reports a status outside 200–206 with the App Store’s retry rule', async () => {
    const webhook = await server(reply(500, 'boom'));
    const result = await runScenario(loadScenario('family-sharing-revoke'), {
      workspace,
      url: webhook.url,
    });
    expect(result.ok).toBe(false);
    expect(result.counts).toMatchObject({ steps: 2, failed: 2 });
    const [problem] = result.steps[0]?.findings ?? [];
    expect(problem?.code).toBe('rejected');
    expect(problem?.message).toBe(
      'The webhook answered 500: the App Store would count the delivery as failed.',
    );
    expect(problem?.fix.steps.join(' ')).toContain('1, 12, 24, 48 and 72 hours');
    expect(problem?.fix.guide).toMatch(/troubleshooting\.md#rejected$/);
    expect(result.steps[0]?.attempts[0]?.body).toBe('boom');
  });

  it('counts 206 as delivered and 207 and redirects as failed, as the App Store does', async () => {
    for (const [status, code] of [
      [206, undefined],
      [207, 'rejected'],
      [301, 'redirect'],
      [204, undefined],
    ] as const) {
      const webhook = await server(
        reply(status, '', status === 301 ? { location: '/elsewhere' } : {}),
      );
      const result = await sendNotification('TEST', undefined, { workspace, url: webhook.url });
      expect(result.steps[0]?.findings[0]?.code, String(status)).toBe(code);
      expect(webhook.received).toHaveLength(1);
    }
  });

  it('resends a failed notification unchanged when retries are on', async () => {
    const webhook = await server((_request, response, index) => {
      response.writeHead(index < 2 ? 503 : 200).end();
    });
    const result = await sendNotification('DID_RENEW', undefined, {
      workspace,
      url: webhook.url,
      retries: 3,
    });
    expect(result.ok).toBe(true);
    expect(result.steps[0]?.attempts.map((attempt) => [attempt.kind, attempt.status])).toEqual([
      ['send', 503],
      ['retry', 503],
      ['retry', 200],
    ]);
    const bodies = new Set(webhook.received.map((request) => request.body));
    expect(bodies.size).toBe(1);

    const always = await server(reply(500));
    const failed = await sendNotification('DID_RENEW', undefined, {
      workspace,
      url: always.url,
      retries: 2,
    });
    expect(failed.steps[0]?.findings[0]?.message).toContain('2 retries failed too.');
  });

  it('finds a webhook that fails on a duplicate notification', async () => {
    const webhook = await server(backend({ failDuplicates: true }));
    const result = await sendNotification('DID_RENEW', undefined, {
      workspace,
      url: webhook.url,
      duplicate: true,
    });
    expect(result.steps[0]?.findings.map((entry) => entry.code)).toEqual(['duplicate-differs']);
    expect(result.steps[0]?.findings[0]?.fix.steps[0]).toContain(
      'identify, and ignore, duplicate notifications',
    );
    const tolerant = await server(backend());
    const ok = await sendNotification('DID_RENEW', undefined, {
      workspace,
      url: tolerant.url,
      duplicate: true,
    });
    expect(ok.ok).toBe(true);
    expect(ok.steps[0]?.attempts).toHaveLength(2);
  });

  it('runs each step’s check against the backend', async () => {
    const scenario = parseScenario(
      {
        steps: [
          {
            type: 'SUBSCRIBED',
            subtype: 'INITIAL_BUY',
            check: { url: '/entitlements/{originalTransactionId}', json: { active: true } },
          },
          {
            type: 'REFUND',
            check: { url: '/entitlements/{originalTransactionId}', json: { active: false } },
          },
        ],
      },
      'refund-check',
    );
    const good = await server(backend());
    const passed = await runScenario(scenario, { workspace, url: `${good.url}/notifications` });
    expect(passed.ok).toBe(true);
    expect(passed.steps[1]?.check?.url).toMatch(/\/entitlements\/2\d{15}$/);
    expect(passed.counts.requests).toBe(4);

    const forgetful = await server(backend({ revokeOnRefund: false }));
    const failed = await runScenario(scenario, {
      workspace,
      url: `${forgetful.url}/notifications`,
    });
    expect(failed.steps.map((step) => step.ok)).toEqual([true, false]);
    const [problem] = failed.steps[1]?.findings ?? [];
    expect(problem?.code).toBe('check-failed');
    expect(problem?.message).toContain('$.active: expected false, got true');
    expect(problem?.fix.steps[0]).toBe('REFUND: The App Store refunded or revoked the purchase.');
  });

  it('reports a webhook that is not there', async () => {
    const webhook = await server(reply(200));
    const url = webhook.url;
    await webhook.close();
    servers.pop();
    const result = await sendNotification('TEST', undefined, { workspace, url });
    expect(result.steps[0]?.findings[0]?.code).toBe('connection-failed');
    expect(result.steps[0]?.findings[0]?.message).toContain('ECONNREFUSED');
  });

  it('times out a webhook that does not answer', async () => {
    const webhook = await server(() => undefined);
    const result = await sendNotification('TEST', undefined, {
      workspace,
      url: webhook.url,
      timeoutMs: 200,
    });
    expect(result.steps[0]?.findings[0]?.code).toBe('timeout');
  });

  it('expects another status when a step says so', async () => {
    const webhook = await server(reply(400));
    const result = await sendNotification('TEST', undefined, {
      workspace,
      url: webhook.url,
      expect: 400,
    });
    expect(result.ok).toBe(true);
    const strict = await sendNotification('TEST', undefined, {
      workspace,
      url: webhook.url,
      expect: [200, 202],
    });
    expect(strict.steps[0]?.findings[0]?.message).toBe(
      'The webhook answered 400; the step expects 200 or 202.',
    );
  });

  it('writes the request bodies without sending in a dry run', async () => {
    const out = join(scratchDir('dry'), 'bodies');
    const result = await runScenario(loadScenario('trial-renew-refund'), {
      workspace,
      dryRun: true,
      outDir: out,
    });
    expect(result.ok).toBe(true);
    expect(readdirSync(out)).toEqual([
      '01-SUBSCRIBED.INITIAL_BUY.json',
      '02-DID_RENEW.json',
      '03-REFUND.json',
    ]);
    const body = JSON.parse(readFileSync(join(out, '03-REFUND.json'), 'utf8'));
    const decoded = await verifier.verifyAndDecodeNotification(body.signedPayload);
    expect(decoded.notificationType).toBe('REFUND');
  });

  it('refuses a missing or unusable URL and unknown placeholders before sending', async () => {
    const scenario = loadScenario('trial-renew-refund');
    await expect(runScenario(scenario, { workspace })).rejects.toThrow('--url');
    await expect(runScenario(scenario, { workspace, url: 'nope' })).rejects.toThrow('is not a URL');
    await expect(runScenario(scenario, { workspace, url: 'ftp://x/' })).rejects.toThrow(
      'http or https',
    );
    const webhook = await server(reply(200));
    const bad = parseScenario({ steps: [{ type: 'TEST', check: { url: '/x/{userId}' } }] }, 'bad');
    await expect(runScenario(bad, { workspace, url: webhook.url })).rejects.toThrow(
      'unknown placeholder {userId}',
    );
    expect(webhook.received).toHaveLength(0);
  });
});

describe('sendAll', () => {
  it('sends all 40 events, each verified by Apple’s library', async () => {
    const webhook = await server(backend());
    const result = await sendAll({ workspace, url: webhook.url });
    expect(result.counts).toMatchObject({ steps: 40, passed: 40, requests: 40 });
    expect(new Set(result.steps.map((step) => step.notificationUUID)).size).toBe(40);
  });
});

describe('containsJson', () => {
  it('matches objects by subset and arrays exactly', () => {
    expect(containsJson({ a: 1 }, { a: 1, b: 2 })).toEqual([]);
    expect(containsJson({ a: { b: [1, 2] } }, { a: { b: [1, 2], c: 3 } })).toEqual([]);
    expect(containsJson({ a: [1] }, { a: [1, 2] })).toEqual(['$.a: expected [1], got [1,2]']);
    expect(containsJson({ a: 1 }, [])).toEqual(['$: expected an object, got []']);
    expect(containsJson({ a: null }, {})).toEqual(['$.a: expected null, got undefined']);
  });
});

describe('headers', () => {
  it('sends --header values to the webhook and same-origin checks, not to other hosts', async () => {
    const other = await server(reply(200, '{}'));
    const webhook = await server(reply(200, '{}'));
    const scenario = parseScenario(
      {
        steps: [
          { type: 'TEST', check: { url: '/state' } },
          { type: 'TEST', check: { url: `${other.url}/state` } },
        ],
      },
      'headers',
    );
    const result = await runScenario(scenario, {
      workspace,
      url: `${webhook.url}/asn`,
      headers: { authorization: 'Bearer secret' },
    });
    expect(result.ok).toBe(true);
    expect(webhook.received.map((request) => request.headers.authorization)).toEqual([
      'Bearer secret',
      'Bearer secret',
      'Bearer secret',
    ]);
    expect(other.received[0]?.headers.authorization).toBeUndefined();
  });
});
