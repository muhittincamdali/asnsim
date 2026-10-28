import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decode, DecodeError, findToken } from '../../src/decode/decode.js';
import { signJws } from '../../src/jws/jws.js';
import { createTestChain } from '../../src/pki/chain.js';
import { signParts } from '../../src/sim/payloads.js';
import { simulation, standalone } from '../helpers/sim.js';

const chain = createTestChain();
const roots = [{ label: 'asnsim test root', der: chain.root }];
const xcode = (name: string) =>
  readFileSync(new URL(`../data/xcode/${name}`, import.meta.url), 'utf8').trim();
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

  it('reads data Xcode StoreKit Testing signed, and skips its verification as Apple’s libraries do', () => {
    for (const [file, kind] of [
      ['transaction-subscription.jws', 'transaction'],
      ['renewal-info.jws', 'renewalInfo'],
    ] as const) {
      const result = decode(xcode(file));
      expect(result.ok).toBe(true);
      expect(result.parts[0]).toMatchObject({
        kind,
        skipped: 'xcode',
        header: { alg: 'ES256', x5c: 1 },
      });
      expect(result.parts[0]?.payload).toMatchObject({
        environment: 'Xcode',
        productId: 'com.example.premium.monthly',
      });
      expect(result.notes[0]).toContain('signed by Xcode, not the App Store');
    }
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
});
