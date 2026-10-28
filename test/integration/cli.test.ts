import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asnsim, stableTimes } from '../helpers/cli.js';
import { scratchDir } from '../helpers/scratch.js';
import { type Handler, startServer } from '../helpers/server.js';

// The command line in-process, in a project folder of its own: init writes .asnsim there, the
// other commands find it. Report snapshots use a fixed start and seed, with times replaced.

const project = scratchDir('cli');
let webhook: Awaited<ReturnType<typeof startServer>>;
let failRefunds = false;

const handler: Handler = (request, response) => {
  const body = request.body ? JSON.parse(request.body) : {};
  const payload = body.signedPayload
    ? JSON.parse(Buffer.from(body.signedPayload.split('.')[1], 'base64url').toString())
    : {};
  response.writeHead(failRefunds && payload.notificationType === 'REFUND' ? 500 : 200).end();
};

beforeAll(async () => {
  webhook = await startServer(handler);
});
afterAll(() => webhook.close());

const fixed = ['--start', '2026-10-01T09:00:00Z', '--seed', 'cli'];

describe('asnsim init', () => {
  it('writes .asnsim and says what to do next', async () => {
    const result = await asnsim(['init', '--bundle-id', 'com.example.pantry'], { cwd: project });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(
      'Wrote a test chain for com.example.pantry (Sandbox) to .asnsim/:',
    );
    expect(result.stdout).toContain('.asnsim/root.cer as the root');
    expect(existsSync(join(project, '.asnsim/root.cer'))).toBe(true);
  });

  it('keeps the chain without --force and needs an app Apple ID for Production', async () => {
    const again = await asnsim(['init'], { cwd: project });
    expect(again.code).toBe(2);
    expect(again.stderr).toMatch(/^asnsim: .*already exists\. Pass --force/);
    const production = await asnsim(['init', '--dir', 'prod', '--environment', 'Production'], {
      cwd: project,
    });
    expect(production.code).toBe(2);
    expect(production.stderr).toContain('--app-apple-id');
  });
});

describe('asnsim run', () => {
  it('runs a built-in scenario and exits 0', async () => {
    const result = await asnsim(
      ['run', 'trial-renew-refund', '--url', `${webhook.url}/asn`, ...fixed],
      {
        cwd: project,
      },
    );
    expect(result.code).toBe(0);
    await expect(
      stableTimes(result.stdout.replace(webhook.url, 'http://127.0.0.1:PORT')),
    ).toMatchFileSnapshot('../__snapshots__/reports/run-trial-renew-refund.txt');
  });

  it('exits 1 with the finding and its fix when the webhook rejects a notification', async () => {
    failRefunds = true;
    try {
      const args = ['run', 'trial-renew-refund', '--url', `${webhook.url}/asn`, ...fixed];
      const text = await asnsim(args, { cwd: project });
      expect(text.code).toBe(1);
      await expect(
        stableTimes(text.stdout.replace(webhook.url, 'http://127.0.0.1:PORT')),
      ).toMatchFileSnapshot('../__snapshots__/reports/run-refund-rejected.txt');
      const markdown = await asnsim([...args, '--format', 'markdown'], { cwd: project });
      await expect(
        stableTimes(markdown.stdout.replace(webhook.url, 'http://127.0.0.1:PORT')),
      ).toMatchFileSnapshot('../__snapshots__/reports/run-refund-rejected.md');
      const json = JSON.parse((await asnsim([...args, '--json'], { cwd: project })).stdout);
      expect(json).toMatchObject({ schemaVersion: 0, tool: { name: 'asnsim' }, ok: false });
      expect(json.steps[2].findings[0].code).toBe('rejected');
    } finally {
      failRefunds = false;
    }
  });

  it('colours the terminal report only on a terminal, and honours NO_COLOR', async () => {
    const args = ['run', 'family-sharing-revoke', '--url', webhook.url];
    expect((await asnsim(args, { cwd: project, stdoutIsTty: true })).stdout).toContain('\u001b[');
    expect((await asnsim(args, { cwd: project })).stdout).not.toContain('\u001b[');
    expect(
      (await asnsim(args, { cwd: project, stdoutIsTty: true, env: { NO_COLOR: '1' } })).stdout,
    ).not.toContain('\u001b[');
    expect((await asnsim(args, { cwd: project, env: { FORCE_COLOR: '1' } })).stdout).toContain(
      '\u001b[',
    );
  });

  it('writes the report to a file and the bodies to a folder', async () => {
    const result = await asnsim(
      [
        'run',
        'upgrade-downgrade',
        '--dry-run',
        '--out',
        'bodies',
        '-o',
        'report.md',
        '-f',
        'markdown',
      ],
      { cwd: project },
    );
    expect(result.code).toBe(0);
    expect(result.stderr).toBe('Wrote report.md: 4 signed, none sent\n');
    expect(readFileSync(join(project, 'report.md'), 'utf8')).toContain('none (dry run)');
    expect(existsSync(join(project, 'bodies/02-DID_CHANGE_RENEWAL_PREF.UPGRADE.json'))).toBe(true);
  });

  it('exits 2 for usage errors', async () => {
    for (const [args, message] of [
      [['run', 'nope', '--url', webhook.url], 'No scenario nope'],
      [['run', 'trial-renew-refund'], 'Give the webhook URL with --url'],
      [
        ['run', 'trial-renew-refund', '--url', webhook.url, '--retries', '9'],
        '--retries is a whole number from 0 to 5',
      ],
      [['run', 'trial-renew-refund', '--url', webhook.url, '--start', 'soon'], 'an ISO 8601 date'],
      [['run', 'trial-renew-refund', '--url', webhook.url, '-H', 'bad header'], 'a header such as'],
      [
        ['run', 'trial-renew-refund', '--url', webhook.url, '--dir', 'none'],
        'Run `asnsim init` first',
      ],
      [
        ['run', 'trial-renew-refund', '--url', webhook.url, '-f', 'xml'],
        'Allowed choices are tty, text, markdown, json',
      ],
    ] as const) {
      const result = await asnsim([...args], { cwd: project });
      expect(result.code, args.join(' ')).toBe(2);
      expect(result.stderr).toContain(message);
      expect(result.stderr).not.toContain('bug in asnsim');
    }
  });

  it('exits 2, before sending, for a webhook URL with a user name or password', async () => {
    const before = webhook.received.length;
    const host = new URL(webhook.url).host;
    for (const url of [`http://alice:hunter2@${host}/asn`, `http://alice@${host}/asn`]) {
      for (const args of [
        ['run', 'trial-renew-refund', '--url', url],
        ['send', 'TEST', '--url', url],
      ]) {
        const result = await asnsim(args, { cwd: project });
        expect(result.code, args.join(' ')).toBe(2);
        expect(result.stderr).toContain('must not hold a user name or password');
        expect(result.stderr).not.toContain('hunter2');
        expect(result.stdout).toBe('');
      }
    }
    expect(webhook.received).toHaveLength(before);
  });

  it('runs a scenario file with a check', async () => {
    writeFileSync(
      join(project, 'mine.yaml'),
      'steps:\n  - type: SUBSCRIBED\n    subtype: INITIAL_BUY\n    check: { url: "/entitlements/{originalTransactionId}", contains: "nothing" }\n',
    );
    const result = await asnsim(['run', 'mine.yaml', '--url', `${webhook.url}/asn`], {
      cwd: project,
    });
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('check-failed');
    expect(result.stdout.replace(/\s+/g, ' ')).toContain('body: does not contain "nothing"');
  });
});

describe('asnsim reports', () => {
  const secrets = ['SEKRET', 'hunter2', 'SECRET-TOKEN-123', 'alice'];

  it('hide query values, IDs and secrets in the answers, in every format and in -o files', async () => {
    const backend = await startServer((request, response) => {
      if (request.method === 'POST') {
        response.writeHead(400).end('denied password=hunter2 token SECRET-TOKEN-123');
      } else {
        response
          .writeHead(200, { 'content-type': 'application/json' })
          .end('{"active":false,"token":"SECRET-TOKEN-123","owner":"alice@example.com"}');
      }
    });
    try {
      const url = `${backend.url}/asn?token=SEKRET`;
      writeFileSync(
        join(project, 'redact.yaml'),
        "steps:\n  - type: TEST\n    expect: { status: 400 }\n    check: { url: '/state/{notificationUUID}?session=SEKRET', json: { active: true } }\n",
      );
      for (const format of ['tty', 'text', 'markdown', 'json']) {
        for (const args of [
          ['send', 'TEST', '--url', url, '-f', format],
          ['run', 'redact.yaml', '--url', url, '-f', format],
          ['run', 'redact.yaml', '--url', url, '-f', format, '-o', `redact.${format}`],
        ]) {
          const result = await asnsim(args, { cwd: project, stdoutIsTty: format === 'tty' });
          const written = args.includes('-o')
            ? readFileSync(join(project, `redact.${format}`), 'utf8')
            : '';
          const report = result.stdout + result.stderr + written;
          expect(result.code, args.join(' ')).toBe(1);
          for (const secret of secrets)
            expect(report, `${args.join(' ')}: ${secret}`).not.toContain(secret);
          expect(report, args.join(' ')).toContain('/asn?token=[redacted]');
        }
      }
      const json = JSON.parse(
        (await asnsim(['run', 'redact.yaml', '--url', url, '-f', 'json'], { cwd: project })).stdout,
      );
      const [step] = json.steps;
      expect(json.url).toBe(`${backend.url}/asn?token=[redacted]`);
      expect(step.attempts[0].body).toBe('denied password=[redacted]');
      expect(step.check.url).toBe(`${backend.url}/state/:id?session=[redacted]`);
      // "SECRET-TOKEN-123" names a secret, so its neighbours are hidden too.
      expect(step.check.body).toBe(
        '{"active":"[redacted]","token":"[redacted]","owner":"[redacted]"}',
      );
      expect(step.check.mismatches).toEqual(['$.active: expected true, got "[redacted]"']);
      const text = (
        await asnsim(['send', 'TEST', '--url', url, '-f', 'text', '--expect', '200'], {
          cwd: project,
        })
      ).stdout;
      expect(text).toContain('answer: denied password=[redacted]');
      // The requests themselves carry what the reports hide.
      expect(backend.received.some((request) => request.url.endsWith('?session=SEKRET'))).toBe(
        true,
      );
    } finally {
      await backend.close();
    }
  });
});

describe('asnsim send', () => {
  it('sends one notification after its history', async () => {
    const before = webhook.received.length;
    const result = await asnsim(
      ['send', 'did_fail_to_renew', 'grace_period', '--url', webhook.url, '--json'],
      {
        cwd: project,
      },
    );
    expect(result.code).toBe(0);
    expect(webhook.received.length - before).toBe(1);
    const json = JSON.parse(result.stdout);
    expect(json.steps[0]).toMatchObject({
      type: 'DID_FAIL_TO_RENEW',
      subtype: 'GRACE_PERIOD',
      access: 'keep',
    });
  });

  it('sends all 40 pairs with --all', async () => {
    const result = await asnsim(['send', '--all', '--url', webhook.url, '--json'], {
      cwd: project,
    });
    expect(result.code).toBe(0);
    expect(JSON.parse(result.stdout).counts).toMatchObject({ steps: 40, passed: 40 });
  });

  it('names the choices for a wrong type or subtype', async () => {
    const wrong = await asnsim(['send', 'EXPIRED', 'LATE', '--url', webhook.url], { cwd: project });
    expect(wrong.code).toBe(2);
    expect(wrong.stderr).toContain('Subtypes of EXPIRED: VOLUNTARY, BILLING_RETRY');
    const none = await asnsim(['send', '--url', webhook.url], { cwd: project });
    expect(none.stderr).toContain('`asnsim types` lists them');
    const both = await asnsim(['send', 'TEST', '--all', '--url', webhook.url], { cwd: project });
    expect(both.stderr).toContain('--all sends every type');
  });

  it('uses the products of a scenario file', async () => {
    writeFileSync(
      join(project, 'products.yaml'),
      'products:\n  - { id: com.acme.gold, type: auto-renewable, period: P1Y, price: 49.99, currency: EUR }\nsteps:\n  - type: TEST\n',
    );
    const result = await asnsim(
      ['payload', 'DID_RENEW', '--products', 'products.yaml', '--decoded', ...fixed],
      { cwd: project },
    );
    expect(result.code).toBe(0);
    const decoded = JSON.parse(result.stdout);
    expect(decoded.transaction).toMatchObject({
      productId: 'com.acme.gold',
      currency: 'EUR',
      price: 49990,
    });
    expect(new Date(decoded.transaction.expiresDate).toISOString()).toBe(
      '2028-10-01T09:00:00.000Z',
    );
  });
});

describe('asnsim payload and decode', () => {
  it('prints a body that decode verifies with the test root, from stdin', async () => {
    const body = await asnsim(['payload', 'REFUND'], { cwd: project });
    expect(Object.keys(JSON.parse(body.stdout))).toEqual(['signedPayload']);
    const decoded = await asnsim(['decode', '-'], { cwd: project, stdin: body.stdout });
    expect(decoded.code).toBe(0);
    expect(decoded.stdout).toContain(
      '3 JWS decoded, 3 verified against asnsim test root (.asnsim/root.cer)',
    );
  });

  it('reports a body it cannot trust with exit 1, and bad input with exit 2', async () => {
    const body = (await asnsim(['payload', 'TEST'], { cwd: project })).stdout;
    writeFileSync(join(project, 'body.json'), body);
    const elsewhere = scratchDir('cli-other');
    const untrusted = await asnsim(['decode', join(project, 'body.json')], { cwd: elsewhere });
    expect(untrusted.code).toBe(1);
    expect(untrusted.stdout).toContain('untrusted-root');
    const trusted = await asnsim(
      ['decode', join(project, 'body.json'), '--root', join(project, '.asnsim/root.pem')],
      {
        cwd: elsewhere,
      },
    );
    expect(trusted.code).toBe(0);
    const unchecked = await asnsim(
      ['decode', join(project, 'body.json'), '--no-verify', '--json'],
      { cwd: elsewhere },
    );
    expect(JSON.parse(unchecked.stdout).parts[0].skipped).toBe('not-requested');
    const garbage = await asnsim(['decode', 'hello'], { cwd: elsewhere });
    expect(garbage.code).toBe(2);
    expect(garbage.stderr).toContain('not a JWS');
  });

  it('reads the Xcode StoreKit Testing fixture', async () => {
    const file = new URL('../data/xcode/transaction-subscription.jws', import.meta.url).pathname;
    const result = await asnsim(['decode', file]);
    expect(result.code).toBe(0);
    await expect(result.stdout).toMatchFileSnapshot(
      '../__snapshots__/reports/decode-xcode-transaction.txt',
    );
  });

  it('checks the bundle ID and environment', async () => {
    const body = (await asnsim(['payload', 'DID_RENEW'], { cwd: project })).stdout;
    const result = await asnsim(
      ['decode', '-', '--bundle-id', 'com.other', '--environment', 'Production'],
      {
        cwd: project,
        stdin: body,
      },
    );
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('bundle-id-mismatch');
    expect(result.stdout).toContain('environment-mismatch');
  });
});

describe('asnsim types and scenarios', () => {
  it('lists the catalog', async () => {
    const result = await asnsim(['types']);
    expect(result.code).toBe(0);
    await expect(result.stdout).toMatchFileSnapshot('../__snapshots__/reports/types.txt');
    const one = JSON.parse((await asnsim(['types', 'expired', '--json'])).stdout);
    expect(one.events).toHaveLength(5);
    expect((await asnsim(['types', 'NOPE'])).code).toBe(2);
  });

  it('lists the built-in scenarios', async () => {
    const result = await asnsim(['scenarios']);
    expect(result.code).toBe(0);
    await expect(result.stdout).toMatchFileSnapshot('../__snapshots__/reports/scenarios.txt');
    expect((await asnsim(['scenarios', 'trial-renew-refund', '-f', 'markdown'])).stdout).toContain(
      '`SUBSCRIBED/INITIAL_BUY` → `DID_RENEW` → `REFUND`',
    );
  });

  it('prints help with the exit codes, and exits 2 without a command', async () => {
    const help = await asnsim(['--help']);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain('Exit codes:');
    expect((await asnsim([])).code).toBe(2);
  });
});
