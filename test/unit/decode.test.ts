import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decode, DecodeError, findToken } from '../../src/decode/decode.js';
import { renderDecode } from '../../src/report/decode.js';
import { signJws } from '../../src/jws/jws.js';
import { createTestChain } from '../../src/pki/chain.js';
import { signParts } from '../../src/sim/payloads.js';
import { simulation, standalone } from '../helpers/sim.js';

const chain = createTestChain();
const roots = [{ label: 'asnsim test root', der: chain.root }];
const xcode = (name: string) =>
  readFileSync(new URL(`../data/xcode/${name}`, import.meta.url), 'utf8').trim();
const base64url = (text: string) => Buffer.from(text).toString('base64url');
/** An unsigned JWS whose payload is `payload`, as written. */
const jwsOf = (payload: string) =>
  `${base64url(JSON.stringify({ alg: 'ES256', x5c: [] }))}.${base64url(payload)}.c2ln`;
const signed = (type: string, subtype?: string | null) =>
  signParts(standalone(type, subtype, simulation({ start: new Date() })).last, chain).signedPayload;

describe('findToken', () => {
  it('takes a bare, quoted or JSON-held token', () => {
    const token = signed('TEST');
    expect(findToken(token)).toEqual({ source: 'jws', token });
    expect(findToken(` "${token}"\n`).token).toBe(token);
    expect(findToken(JSON.stringify({ signedPayload: token })).source).toBe('signedPayload');
    expect(findToken(JSON.stringify({ signedTransactionInfo: token })).source).toBe(
      'signedTransactionInfo',
    );
  });

  it('explains input it cannot use', () => {
    expect(() => findToken('hello')).toThrow(DecodeError);
    expect(() => findToken('{')).toThrow('not valid JSON');
    expect(() => findToken('{"other":"x.y.z"}')).toThrow('none of signedPayload');
    expect(() => findToken('x'.repeat(2_000_001))).toThrow('larger than 2 MB');
  });
});

describe('decode', () => {
  it('decodes a notification and the JWS inside it, and verifies each', () => {
    const result = decode(signed('DID_RENEW'), { roots });
    expect(result.ok).toBe(true);
    expect(result.parts.map((part) => [part.path, part.kind, part.verification?.root])).toEqual([
      ['jws', 'notification', 'asnsim test root'],
      ['data.signedTransactionInfo', 'transaction', 'asnsim test root'],
      ['data.signedRenewalInfo', 'renewalInfo', 'asnsim test root'],
    ]);
    expect(result.parts[0]?.header).toEqual({ alg: 'ES256', x5c: 3 });
  });

  it('decodes the signed app transaction of RESCIND_CONSENT', () => {
    const result = decode(JSON.stringify({ signedPayload: signed('RESCIND_CONSENT') }), { roots });
    expect(result.parts.map((part) => part.path)).toEqual([
      'signedPayload',
      'appData.signedAppTransactionInfo',
    ]);
    expect(result.parts[1]?.kind).toBe('appTransaction');
  });

  it('does not trust asnsim data under Apple’s root alone', () => {
    const result = decode(signed('TEST'));
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toMatchObject({ path: 'jws', code: 'untrusted-root' });
    expect(result.problems[0]?.fix).toContain('--root .asnsim/root.cer');
  });

  it('reports a changed payload with the path of the JWS', () => {
    const [header, , signature] = signed('TEST').split('.');
    const forged = Buffer.from(
      JSON.stringify({ notificationType: 'REFUND', signedDate: Date.now() }),
    ).toString('base64url');
    const result = decode(`${header}.${forged}.${signature}`, { roots });
    expect(result.problems.map((problem) => problem.code)).toEqual(['bad-signature']);
  });

  it('checks the bundle ID and environment when asked', () => {
    const result = decode(signed('DID_RENEW'), {
      roots,
      bundleId: 'com.other.app',
      environment: 'Production',
    });
    expect(result.problems.map((problem) => [problem.path, problem.code])).toEqual([
      ['jws', 'bundle-id-mismatch'],
      ['jws', 'environment-mismatch'],
      ['data.signedTransactionInfo', 'bundle-id-mismatch'],
      ['data.signedTransactionInfo', 'environment-mismatch'],
      ['data.signedRenewalInfo', 'environment-mismatch'],
    ]);
  });

  it('skips verification when told to', () => {
    const result = decode(signed('TEST'), { verify: false });
    expect(result.ok).toBe(true);
    expect(result.parts[0]?.skipped).toBe('not-requested');
    expect(result.parts[0]?.verification).toBeUndefined();
  });

  it('verifies data that says environment Xcode unless told otherwise', () => {
    // Apple's SignedDataVerifier skips the checks only when it is set up for the Xcode
    // environment, never because the payload says so.
    for (const file of ['transaction-subscription.jws', 'renewal-info.jws']) {
      const result = decode(xcode(file));
      expect(result.ok).toBe(false);
      expect(result.parts[0]?.skipped).toBeUndefined();
      expect(result.parts[0]?.verification?.ok).toBe(false);
      expect(result.problems.map((problem) => problem.code)).toContain('chain-length');
      expect(result.notes[0]).toContain('pass --environment Xcode');
    }
  });

  it('does not trust a payload that claims environment Xcode (SF-ASN-4)', () => {
    const payload = {
      transactionId: '1',
      environment: 'Xcode',
      bundleId: 'com.example.app',
      signedDate: Date.now(),
    };
    const token = signJws(payload, chain.signingKey, [
      chain.signing,
      chain.intermediate,
      chain.root,
    ]);
    expect(decode(token, { roots }).ok).toBe(true);
    const [header, , signature] = token.split('.');
    const changed = `${header}.${base64url(JSON.stringify({ ...payload, productId: 'lifetime' }))}.${signature}`;
    const forged = decode(changed, { roots });
    expect(forged.ok).toBe(false);
    expect(forged.problems.map((problem) => problem.code)).toContain('bad-signature');
    const unsigned = decode(jwsOf(JSON.stringify(payload)), { roots });
    expect(unsigned.ok).toBe(false);
    expect(unsigned.parts[0]?.verification?.ok).toBe(false);
  });

  it('reads Xcode StoreKit Testing data with --environment Xcode, and says it is not verified', () => {
    for (const [file, kind] of [
      ['transaction-subscription.jws', 'transaction'],
      ['renewal-info.jws', 'renewalInfo'],
    ] as const) {
      const result = decode(xcode(file), { environment: 'Xcode' });
      expect(result.ok).toBe(false);
      expect(result.problems).toEqual([expect.objectContaining({ code: 'not-verified' })]);
      expect(result.parts[0]).toMatchObject({
        kind,
        skipped: 'xcode',
        header: { alg: 'ES256', x5c: 1 },
      });
      expect(result.parts[0]?.verification).toBeUndefined();
      expect(result.parts[0]?.payload).toMatchObject({
        environment: 'Xcode',
        productId: 'com.example.premium.monthly',
      });
      expect(result.notes).toEqual([]);
    }
    // As with Apple's verifier, the environment is still checked.
    const sandbox = decode(signed('TEST'), { environment: 'Xcode' });
    expect(sandbox.problems.map((problem) => problem.code)).toEqual([
      'not-verified',
      'environment-mismatch',
    ]);
    // --no-verify reads it without a problem, as it reads anything.
    expect(decode(xcode('transaction-subscription.jws'), { verify: false }).ok).toBe(true);
  });

  it('notes nested fields that are not JWS', () => {
    const token = signJws(
      { notificationType: 'TEST', signedDate: Date.now(), data: { signedTransactionInfo: 'x.y' } },
      chain.signingKey,
      [chain.signing, chain.intermediate, chain.root],
    );
    const result = decode(token, { roots });
    expect(result.parts).toHaveLength(1);
    expect(result.notes[0]).toBe(
      'data.signedTransactionInfo is not a readable JWS: A JWS has three parts separated by dots.',
    );
  });

  it('reports a JWS it does not decode, wherever it is, as a problem', () => {
    const keys = [chain.signing, chain.intermediate, chain.root];
    // Written as text: JSON.stringify of an array 5,000 levels deep overflows the stack on Linux.
    const deep = jwsOf(`${'['.repeat(5000)}${']'.repeat(5000)}`);
    const token = signJws(
      {
        notificationType: 'TEST',
        signedDate: Date.now(),
        signedTransactionInfo: deep,
        list: [{ jws: deep }],
        version: '1.2.3',
      },
      chain.signingKey,
      keys,
    );
    const result = decode(token, { roots });
    expect(result.ok).toBe(false);
    expect(result.parts).toHaveLength(1);
    expect(result.problems).toEqual([
      expect.objectContaining({
        path: 'jws',
        code: 'unread-jws',
        message: expect.stringContaining(
          '2 JWS were not decoded: signedTransactionInfo, list[0].jws.',
        ),
      }),
    ]);
    // A JWS the reader decodes is not one.
    expect(decode(signed('REFUND'), { roots }).problems).toEqual([]);
  });

  it('leaves out a payload nested more than 64 levels deep, in every report format', () => {
    const deep = jwsOf(`${'['.repeat(100_000)}${']'.repeat(100_000)}`);
    const outer = jwsOf(
      JSON.stringify({ notificationType: 'TEST', data: { signedTransactionInfo: deep } }),
    );
    const result = decode(outer, { verify: false });
    expect(result.parts.map((part) => part.path)).toEqual(['jws', 'data.signedTransactionInfo']);
    expect(result.parts[1]?.payload).toBe('[payload nested more than 64 levels deep, not shown]');
    expect(result.problems).toEqual([
      expect.objectContaining({ path: 'data.signedTransactionInfo', code: 'deep-payload' }),
    ]);
    for (const format of ['tty', 'text', 'markdown', 'json'] as const) {
      expect(renderDecode(result, format)).toContain('deep-payload');
    }
    // 64 levels are still shown.
    const shallow = jwsOf(`${'['.repeat(64)}${']'.repeat(64)}`);
    expect(decode(shallow, { verify: false }).problems).toEqual([]);
  });

  it('lists at most five unread JWS by path', () => {
    const jws = signJws({ a: 1 }, chain.signingKey, [chain.signing]);
    const token = signJws(
      { notificationType: 'TEST', signedDate: Date.now(), list: Array(7).fill(jws) },
      chain.signingKey,
      [chain.signing, chain.intermediate, chain.root],
    );
    const [problem] = decode(token, { roots }).problems;
    expect(problem?.message).toContain(
      '7 JWS were not decoded: list[0], list[1], list[2], list[3], list[4], and 2 more.',
    );
  });
});
