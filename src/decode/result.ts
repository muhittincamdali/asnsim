import type { CertificateInfo } from '../pki/certificate.js';
import type { ProblemCode, TrustedRoot } from '../pki/verify.js';

// What decode() takes and returns, and the fix the report gives for each problem it finds.

export class DecodeError extends Error {
  override name = 'DecodeError';
}

export type PartKind =
  'notification' | 'transaction' | 'renewalInfo' | 'appTransaction' | 'unknown';

export type DecodeProblemCode =
  | ProblemCode
  | 'bundle-id-mismatch'
  | 'environment-mismatch'
  | 'unread-jws'
  | 'deep-payload'
  | 'not-verified';

export interface DecodeProblem {
  /** Which JWS: "signedPayload", "data.signedTransactionInfo", … */
  path: string;
  code: DecodeProblemCode;
  message: string;
  fix: string;
}

export interface DecodedPart {
  path: string;
  kind: PartKind;
  header: { alg: unknown; x5c: number };
  payload: unknown;
  /** Undefined when verification was skipped (--no-verify, or --environment Xcode). */
  verification?: {
    ok: boolean;
    root?: string;
    effectiveDate: string;
    certificates: CertificateInfo[];
  };
  skipped?: 'not-requested' | 'xcode';
}

export interface DecodeResult {
  /** The field the outermost JWS came from, or "jws" for a bare token. */
  source: string;
  parts: DecodedPart[];
  problems: DecodeProblem[];
  notes: string[];
  ok: boolean;
}

export interface DecodeOptions {
  /** Check signatures and chains. Default true. */
  verify?: boolean;
  /** Roots to trust besides Apple Root CA - G3. */
  roots?: TrustedRoot[];
  /** Leave Apple Root CA - G3 out of the trusted roots. */
  withoutAppleRoot?: boolean;
  bundleId?: string;
  /**
   * Fail unless the data is from this environment. "Xcode" also skips verification, as Apple's
   * SignedDataVerifier does when it is set up for the Xcode environment, and reports it.
   */
  environment?: string;
}

export const FIXES: Record<DecodeProblemCode, string> = {
  'unsupported-algorithm': 'App Store data is signed with ES256; this token was made elsewhere.',
  'chain-length':
    'App Store data carries three certificates in x5c. A token from Xcode StoreKit Testing or another signer has another chain.',
  'unreadable-certificate': 'The x5c certificates are damaged: copy the whole token again.',
  'untrusted-root':
    'A payload from Apple chains to Apple Root CA - G3, which is trusted by default. For a payload from asnsim, run decode in the folder that holds .asnsim, or pass --dir or --root .asnsim/root.cer.',
  'not-issued-by-intermediate':
    'The certificates of x5c do not form a chain: copy the whole token again.',
  'intermediate-not-ca':
    'The intermediate certificate is not a CA: this is not App Store signed data.',
  'missing-signing-extension':
    'The signing certificate lacks Apple’s receipt signing extension: this is not App Store signed data.',
  'missing-intermediate-extension':
    'The intermediate lacks Apple’s WWDR extension: this is not App Store signed data.',
  'not-valid-at-date':
    'The data was signed outside the certificates’ validity. For an asnsim chain, run `asnsim init --force` and send again.',
  'bad-signature':
    'The payload or header was changed after signing, or signed with another key: do not trust its content.',
  'bundle-id-mismatch':
    'The data is for another app: check --bundle-id, or where the data came from.',
  'environment-mismatch':
    'The data is from another environment: Sandbox and Production data need separate handling.',
  'deep-payload':
    'App Store payloads are a few levels deep, so this one was not made by the App Store. Do not trust its content.',
  'not-verified':
    'Xcode signs StoreKit Testing data with its own key, so nothing proves where it came from. Use it only in tests; a server must not accept environment Xcode.',
  'unread-jws':
    'App Store data holds signed values only in those fields. Decode each value on its own with asnsim decode, and check where this payload came from before trusting it.',
};
