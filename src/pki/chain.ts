import { generateKeyPairSync, type KeyObject, randomBytes } from 'node:crypto';
import { buildCertificate, type Name, OID } from './certificate.js';

/**
 * A three-certificate chain shaped like the one the App Store signs with: a root, an intermediate
 * with Apple's WWDR intermediate extension, and a signing certificate with Apple's receipt
 * signing extension. The names say plainly that it is a test chain and not Apple's.
 */
export interface TestChain {
  root: Uint8Array;
  intermediate: Uint8Array;
  signing: Uint8Array;
  /** Private key of the signing certificate; the CA keys are discarded once the chain exists. */
  signingKey: KeyObject;
}

export const CHAIN_NAMES = {
  root: { CN: 'asnsim Test Root CA', OU: 'Local testing only', O: 'asnsim (not Apple)' },
  intermediate: {
    CN: 'asnsim Test Intermediate CA',
    OU: 'Local testing only',
    O: 'asnsim (not Apple)',
  },
  signing: {
    CN: 'asnsim Test Signing Certificate',
    OU: 'Local testing only',
    O: 'asnsim (not Apple)',
  },
} as const satisfies Record<string, Name>;

const DAY = 86_400_000;

export interface ChainOptions {
  /** Defaults to the current time. */
  now?: Date;
  /**
   * Days before `now` the certificates become valid. Apple's libraries check the chain at the
   * notification's signedDate when online checks are off, so scenarios dated in the past need
   * room. Default 730.
   */
  validBeforeDays?: number;
  /** Days after `now` the certificates stay valid. Default 3650. */
  validAfterDays?: number;
}

const p256 = () => generateKeyPairSync('ec', { namedCurve: 'P-256' });

function serial(): Uint8Array {
  const bytes = randomBytes(16);
  bytes[0] = (bytes[0] ?? 0) & 0x7f;
  return bytes;
}

export function createTestChain(options: ChainOptions = {}): TestChain {
  const now = options.now ?? new Date();
  const notBefore = new Date(now.getTime() - (options.validBeforeDays ?? 730) * DAY);
  const notAfter = new Date(now.getTime() + (options.validAfterDays ?? 3650) * DAY);
  const rootKeys = p256();
  const intermediateKeys = p256();
  const signingKeys = p256();
  const validity = { notBefore, notAfter };
  const root = buildCertificate({
    subject: CHAIN_NAMES.root,
    issuer: CHAIN_NAMES.root,
    publicKey: rootKeys.publicKey,
    signingKey: rootKeys.privateKey,
    issuerPublicKey: rootKeys.publicKey,
    serial: serial(),
    ...validity,
    ca: true,
  });
  const intermediate = buildCertificate({
    subject: CHAIN_NAMES.intermediate,
    issuer: CHAIN_NAMES.root,
    publicKey: intermediateKeys.publicKey,
    signingKey: rootKeys.privateKey,
    issuerPublicKey: rootKeys.publicKey,
    serial: serial(),
    ...validity,
    ca: true,
    pathLength: 0,
    appleExtension: OID.appleWwdrIntermediate,
  });
  const signing = buildCertificate({
    subject: CHAIN_NAMES.signing,
    issuer: CHAIN_NAMES.intermediate,
    publicKey: signingKeys.publicKey,
    signingKey: intermediateKeys.privateKey,
    issuerPublicKey: intermediateKeys.publicKey,
    serial: serial(),
    ...validity,
    ca: false,
    appleExtension: OID.appleReceiptSigning,
  });
  return { root, intermediate, signing, signingKey: signingKeys.privateKey };
}
