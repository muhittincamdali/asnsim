import { execFileSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fingerprint,
  formatName,
  hasExtension,
  OID,
  readCertificate,
  readCertificates,
  toPem,
} from '../../src/pki/certificate.js';
import { CHAIN_NAMES, createTestChain } from '../../src/pki/chain.js';
import { DerError } from '../../src/pki/der.js';
import { scratchDir } from '../helpers/scratch.js';

const APPLE = new URL('../data/apple/', import.meta.url);
const appleFile = (name: string) => Uint8Array.from(readFileSync(new URL(name, APPLE)));

describe('createTestChain', () => {
  const now = new Date('2026-10-28T10:00:00Z');
  const chain = createTestChain({ now });
  const root = new X509Certificate(chain.root);
  const intermediate = new X509Certificate(chain.intermediate);
  const signing = new X509Certificate(chain.signing);

  it('issues each certificate from the one above it', () => {
    expect(root.verify(root.publicKey)).toBe(true);
    expect(intermediate.verify(root.publicKey)).toBe(true);
    expect(signing.verify(intermediate.publicKey)).toBe(true);
    expect(intermediate.checkIssued(root)).toBe(true);
    expect(signing.checkIssued(intermediate)).toBe(true);
    expect(signing.verify(root.publicKey)).toBe(false);
  });

  it('marks the CAs and copies the two Apple extensions', () => {
    expect([root.ca, intermediate.ca, signing.ca]).toEqual([true, true, false]);
    expect(hasExtension(readCertificate(chain.intermediate), OID.appleWwdrIntermediate)).toBe(true);
    expect(hasExtension(readCertificate(chain.signing), OID.appleReceiptSigning)).toBe(true);
    expect(hasExtension(readCertificate(chain.root), OID.appleReceiptSigning)).toBe(false);
  });

  it('names the chain as a test chain that is not Apple’s', () => {
    expect(readCertificate(chain.root).subject).toEqual(CHAIN_NAMES.root);
    expect(readCertificate(chain.signing).issuer).toEqual(CHAIN_NAMES.intermediate);
    expect(formatName(readCertificate(chain.root).subject)).toBe(
      'CN=asnsim Test Root CA, OU=Local testing only, O=asnsim (not Apple)',
    );
  });

  it('is valid from two years before to ten years after the given time by default', () => {
    const info = readCertificate(chain.signing);
    expect(info.notBefore.toISOString()).toBe('2024-10-28T10:00:00.000Z');
    expect(info.notAfter.toISOString()).toBe('2036-10-25T10:00:00.000Z');
    const short = readCertificate(
      createTestChain({ now, validBeforeDays: 1, validAfterDays: 2 }).signing,
    );
    expect(short.notAfter.getTime() - short.notBefore.getTime()).toBe(3 * 86_400_000);
  });

  it('gives every certificate a new positive serial number', () => {
    const serials = [chain.root, chain.intermediate, chain.signing].map(
      (der) => readCertificate(der).serialNumber,
    );
    expect(new Set(serials).size).toBe(3);
    for (const serial of serials)
      expect(Number.parseInt(serial.slice(0, 2), 16)).toBeLessThan(0x80);
  });

  it('passes openssl verify', () => {
    const dir = scratchDir('openssl');
    writeFileSync(join(dir, 'root.pem'), toPem(chain.root));
    writeFileSync(join(dir, 'intermediate.pem'), toPem(chain.intermediate));
    writeFileSync(join(dir, 'signing.pem'), toPem(chain.signing));
    let output: string;
    try {
      output = execFileSync(
        'openssl',
        [
          'verify',
          '-attime',
          String(now.getTime() / 1000),
          '-CAfile',
          'root.pem',
          '-untrusted',
          'intermediate.pem',
          'signing.pem',
        ],
        { cwd: dir, encoding: 'utf8' },
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; // no openssl on this machine
      throw error;
    }
    expect(output.trim()).toBe('signing.pem: OK');
  });
});

describe('readCertificate', () => {
  it('reads Apple’s root, its G6 intermediate and the signing certificate', () => {
    const root = readCertificate(appleFile('AppleRootCA-G3.cer'));
    const wwdr = readCertificate(appleFile('AppleWWDRCAG6.cer'));
    const signing = readCertificate(appleFile('prod-ecc-receipt-signing-2025.cer'));
    expect(root.subject).toEqual({
      CN: 'Apple Root CA - G3',
      OU: 'Apple Certification Authority',
      O: 'Apple Inc.',
      C: 'US',
    });
    expect(root.isCa).toBe(true);
    expect(root.sha256).toBe(
      '63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79',
    );
    expect(wwdr.issuer.CN).toBe('Apple Root CA - G3');
    expect(hasExtension(wwdr, OID.appleWwdrIntermediate)).toBe(true);
    expect(signing.subject.CN).toBe('Prod ECC Mac App Store and iTunes Store Receipt Signing');
    expect(signing.isCa).toBe(false);
    expect(hasExtension(signing, OID.appleReceiptSigning)).toBe(true);
    expect(signing.notBefore.toISOString()).toBe('2025-09-19T19:44:51.000Z');
    expect(signing.notAfter.toISOString()).toBe('2027-10-13T17:47:23.000Z');
  });

  it('rejects data that is not a certificate', () => {
    expect(() => readCertificate(Uint8Array.of(0x05, 0x00))).toThrow(DerError);
    expect(() => readCertificate(new TextEncoder().encode('hello'))).toThrow(DerError);
  });
});

describe('PEM', () => {
  it('round-trips one or several certificates and passes DER through', () => {
    const chain = createTestChain();
    const pem = toPem(chain.root) + toPem(chain.signing);
    const read = readCertificates(new TextEncoder().encode(pem));
    expect(read.map(fingerprint)).toEqual([fingerprint(chain.root), fingerprint(chain.signing)]);
    expect(readCertificates(chain.root)).toEqual([chain.root]);
    expect(
      toPem(chain.root)
        .split('\n')
        .every((line) => line.length <= 64),
    ).toBe(true);
  });
});
