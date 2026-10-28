import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeJws, JwsError, looksLikeJws, signJws } from '../../src/jws/jws.js';
import { APPLE_ROOT_CA_G3, APPLE_ROOT_CA_G3_SHA256 } from '../../src/pki/apple-root.js';
import { buildCertificate, fingerprint, OID } from '../../src/pki/certificate.js';
import { CHAIN_NAMES, createTestChain, type TestChain } from '../../src/pki/chain.js';
import { effectiveDateOf, type TrustedRoot, verifySignedData } from '../../src/pki/verify.js';

const now = new Date('2026-10-28T10:00:00Z');
const chain = createTestChain({ now });
const x5c = (c: TestChain) => [c.signing, c.intermediate, c.root];
const trusted: TrustedRoot[] = [{ label: 'test root', der: chain.root }];
const payload = { notificationType: 'TEST', signedDate: now.getTime() };
const codes = (token: string, roots = trusted, at = now) =>
  verifySignedData(decodeJws(token), roots, at).problems.map((problem) => problem.code);

describe('JWS', () => {
  it('signs ES256 with the chain in x5c and decodes it back', () => {
    const token = signJws(payload, chain.signingKey, x5c(chain));
    expect(looksLikeJws(token)).toBe(true);
    const decoded = decodeJws(token);
    expect(decoded.header.alg).toBe('ES256');
    expect(decoded.x5c.map(fingerprint)).toEqual(x5c(chain).map(fingerprint));
    expect(decoded.payload).toEqual(payload);
    expect(decoded.signature).toHaveLength(64);
  });

  it('rejects text that is not a compact JWS', () => {
    expect(looksLikeJws('a.b')).toBe(false);
    expect(looksLikeJws('{"signedPayload":1}')).toBe(false);
    expect(() => decodeJws('a.b')).toThrow(JwsError);
    expect(() => decodeJws('!!.e30.')).toThrow('not base64url');
    expect(() => decodeJws(`${Buffer.from('[1]').toString('base64url')}.e30.`)).toThrow(
      'not a JSON object',
    );
    expect(() => decodeJws(`e30.${Buffer.from('nope').toString('base64url')}.`)).toThrow(
      'payload is not JSON',
    );
    expect(() => decodeJws('a'.repeat(1_000_001))).toThrow('longer than');
  });
});

describe('verifySignedData', () => {
  it('accepts a payload signed by the test chain', () => {
    const result = verifySignedData(
      decodeJws(signJws(payload, chain.signingKey, x5c(chain))),
      trusted,
      now,
    );
    expect(result.ok).toBe(true);
    expect(result.root?.label).toBe('test root');
    expect(result.certificates.map((info) => info.subject.CN)).toEqual([
      CHAIN_NAMES.signing.CN,
      CHAIN_NAMES.intermediate.CN,
      CHAIN_NAMES.root.CN,
    ]);
  });

  it('does not trust the test chain under Apple’s root alone', () => {
    const token = signJws(payload, chain.signingKey, x5c(chain));
    expect(codes(token, [{ label: 'Apple Root CA - G3', der: APPLE_ROOT_CA_G3 }])).toEqual([
      'untrusted-root',
    ]);
    expect(codes(token, [])).toEqual(['untrusted-root']);
  });

  it('ignores the root in x5c, as Apple’s libraries do', () => {
    const other = createTestChain({ now });
    const token = signJws(payload, chain.signingKey, [
      chain.signing,
      chain.intermediate,
      other.root,
    ]);
    expect(codes(token)).toEqual([]);
  });

  it('reports a changed payload', () => {
    const [header, , signature] = signJws(payload, chain.signingKey, x5c(chain)).split('.');
    const forged = Buffer.from(JSON.stringify({ ...payload, notificationType: 'REFUND' })).toString(
      'base64url',
    );
    expect(codes(`${header}.${forged}.${signature}`)).toEqual(['bad-signature']);
  });

  it('reports a key that does not belong to the signing certificate', () => {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    expect(codes(signJws(payload, privateKey, x5c(chain)))).toEqual(['bad-signature']);
  });

  it('needs exactly three certificates', () => {
    expect(codes(signJws(payload, chain.signingKey, [chain.signing, chain.intermediate]))).toEqual([
      'chain-length',
    ]);
    expect(codes(signJws(payload, chain.signingKey, []))).toEqual(['chain-length']);
  });

  it('reports unreadable certificates and other algorithms', () => {
    const token = signJws(payload, chain.signingKey, [
      Uint8Array.of(1, 2),
      chain.intermediate,
      chain.root,
    ]);
    expect(codes(token)).toEqual(['unreadable-certificate']);
    const [, body, signature] = signJws(payload, chain.signingKey, x5c(chain)).split('.');
    const header = Buffer.from(
      JSON.stringify({
        alg: 'HS256',
        x5c: x5c(chain).map((der) => Buffer.from(der).toString('base64')),
      }),
    ).toString('base64url');
    expect(codes(`${header}.${body}.${signature}`)).toContain('unsupported-algorithm');
  });

  it('checks every certificate at the effective date', () => {
    const token = signJws(payload, chain.signingKey, x5c(chain));
    const later = new Date('2040-01-01T00:00:00Z');
    expect(codes(token, trusted, later)).toEqual([
      'not-valid-at-date',
      'not-valid-at-date',
      'not-valid-at-date',
    ]);
  });

  it('needs Apple’s extensions on the signing certificate and the intermediate', () => {
    const rootKeys = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const middleKeys = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const leafKeys = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const validity = { notBefore: new Date('2026-01-01Z'), notAfter: new Date('2027-01-01Z') };
    const serial = Uint8Array.of(1);
    const root = buildCertificate({
      subject: { CN: 'R' },
      issuer: { CN: 'R' },
      publicKey: rootKeys.publicKey,
      signingKey: rootKeys.privateKey,
      issuerPublicKey: rootKeys.publicKey,
      serial,
      ...validity,
      ca: true,
    });
    const middle = buildCertificate({
      subject: { CN: 'I' },
      issuer: { CN: 'R' },
      publicKey: middleKeys.publicKey,
      signingKey: rootKeys.privateKey,
      issuerPublicKey: rootKeys.publicKey,
      serial,
      ...validity,
      ca: false,
    });
    const leaf = buildCertificate({
      subject: { CN: 'L' },
      issuer: { CN: 'I' },
      publicKey: leafKeys.publicKey,
      signingKey: middleKeys.privateKey,
      issuerPublicKey: middleKeys.publicKey,
      serial,
      ...validity,
      ca: false,
      appleExtension: OID.appleWwdrIntermediate,
    });
    const token = signJws(payload, leafKeys.privateKey, [leaf, middle, root]);
    expect(codes(token, [{ label: 'R', der: root }])).toEqual([
      'intermediate-not-ca',
      'missing-signing-extension',
      'missing-intermediate-extension',
    ]);
  });

  it('finds Apple Root CA - G3 behind Apple’s G6 intermediate', () => {
    const apple = (name: string) =>
      Uint8Array.from(readFileSync(new URL(`../data/apple/${name}`, import.meta.url)));
    expect(fingerprint(APPLE_ROOT_CA_G3)).toBe(APPLE_ROOT_CA_G3_SHA256);
    expect(fingerprint(apple('AppleRootCA-G3.cer'))).toBe(APPLE_ROOT_CA_G3_SHA256);
    // A token with Apple's real chain and a signature asnsim cannot make: everything but the
    // signature passes, which shows the chain checks accept the App Store's certificates.
    const chainB64 = [
      apple('prod-ecc-receipt-signing-2025.cer'),
      apple('AppleWWDRCAG6.cer'),
      apple('AppleRootCA-G3.cer'),
    ].map((der) => Buffer.from(der).toString('base64'));
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', x5c: chainB64 })).toString(
      'base64url',
    );
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const token = `${header}.${body}.${Buffer.alloc(64).toString('base64url')}`;
    const result = verifySignedData(
      decodeJws(token),
      [{ label: 'Apple Root CA - G3', der: APPLE_ROOT_CA_G3 }],
      now,
    );
    expect(result.root?.label).toBe('Apple Root CA - G3');
    expect(result.problems.map((problem) => problem.code)).toEqual(['bad-signature']);
  });
});

describe('effectiveDateOf', () => {
  it('uses signedDate, then receiptCreationDate, then the current time', () => {
    expect(effectiveDateOf({ signedDate: 5 }).getTime()).toBe(5);
    expect(effectiveDateOf({ receiptCreationDate: 7 }).getTime()).toBe(7);
    expect(effectiveDateOf({ signedDate: 'x' }, now)).toBe(now);
    expect(effectiveDateOf(null, now)).toBe(now);
  });
});
