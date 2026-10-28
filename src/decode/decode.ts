import { type DecodedJws, decodeJws, JwsError, looksLikeJws } from '../jws/jws.js';
import { APPLE_ROOT_CA_G3 } from '../pki/apple-root.js';
import type { CertificateInfo } from '../pki/certificate.js';
import {
  type ChainVerification,
  effectiveDateOf,
  type ProblemCode,
  type TrustedRoot,
  verifySignedData,
} from '../pki/verify.js';

// Reads what the App Store sends or returns (a notification body, a signedPayload, a signed
// transaction, renewal info or app transaction, or an App Store Server API response that holds
// them), decodes every JWS inside, and checks each one as Apple's libraries do. It reads only
// the text it is given; nothing is sent anywhere.

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

const FIXES: Record<DecodeProblemCode, string> = {
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

const NESTED: [string, PartKind][] = [
  ['signedTransactionInfo', 'transaction'],
  ['signedRenewalInfo', 'renewalInfo'],
  ['signedAppTransactionInfo', 'appTransaction'],
];

const API_FIELDS = [
  'signedPayload',
  'signedTransactionInfo',
  'signedRenewalInfo',
  'signedAppTransactionInfo',
  'signedTransaction',
  'signedAppTransaction',
] as const;

const MAX_INPUT = 2_000_000;
const XCODE = 'Xcode';
const LISTED_UNREAD = 5;
// App Store payloads are three or four levels deep; a deeper one is shown as a note instead, so
// no report has to print (and JSON.stringify) arrays nested thousands of levels deep.
const MAX_PAYLOAD_DEPTH = 64;

/** Whether `value` holds arrays or objects nested more than `limit` levels deep. */
function deeperThan(value: unknown, limit: number): boolean {
  const stack: [unknown, number][] = [[value, 0]];
  while (stack.length > 0) {
    const [item, depth] = stack.pop() as [unknown, number];
    if (typeof item !== 'object' || item === null) continue;
    if (depth >= limit) return true;
    for (const child of Object.values(item)) stack.push([child, depth + 1]);
  }
  return false;
}

/** A string the reports show as a nested JWS: a JSON header ("ey…") and three parts. */
export const NESTED_JWS = /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

/**
 * Key paths (data.x, items[0].y) of the JWS-shaped strings in `payload` that decode() does not
 * read: every one but data.<NESTED> and appData.<NESTED>. Walked with a stack, so a deeply nested
 * payload cannot overflow the call stack.
 */
function unreadJws(payload: unknown): string[] {
  const found: string[] = [];
  const stack: [path: string, value: unknown][] = [['', payload]];
  while (stack.length > 0) {
    const [path, value] = stack.pop() as [string, unknown];
    if (typeof value === 'string') {
      const read = NESTED.some(
        ([field]) => path === `data.${field}` || path === `appData.${field}`,
      );
      if (!read && NESTED_JWS.test(value)) found.push(path || 'payload');
    } else if (Array.isArray(value)) {
      for (let index = value.length - 1; index >= 0; index--) {
        stack.push([`${path}[${index}]`, value[index]]);
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, entry] of Object.entries(value).reverse()) {
        stack.push([path ? `${path}.${key}` : key, entry]);
      }
    }
  }
  return found;
}

/** Finds the token in what the user pasted: a JWS, a quoted JWS, or JSON holding one. */
export function findToken(input: string): { source: string; token: string } {
  if (input.length > MAX_INPUT) throw new DecodeError('The input is larger than 2 MB.');
  const text = input.trim().replace(/^"(.*)"$/s, '$1');
  if (looksLikeJws(text)) return { source: 'jws', token: text };
  if (text.startsWith('{')) {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new DecodeError('The input starts like JSON but is not valid JSON.');
    }
    if (typeof json === 'object' && json !== null) {
      for (const field of API_FIELDS) {
        const value = (json as Record<string, unknown>)[field];
        if (typeof value === 'string' && looksLikeJws(value))
          return { source: field, token: value };
      }
    }
    throw new DecodeError(
      `The JSON has none of ${API_FIELDS.join(', ')} holding a JWS. Paste the notification body, its signedPayload, or a signed transaction.`,
    );
  }
  throw new DecodeError(
    'The input is not a JWS (three base64url parts separated by dots) or JSON holding one.',
  );
}

function kindOf(payload: unknown): PartKind {
  if (typeof payload !== 'object' || payload === null) return 'unknown';
  const record = payload as Record<string, unknown>;
  if ('notificationType' in record) return 'notification';
  if ('receiptType' in record) return 'appTransaction';
  if ('autoRenewStatus' in record || 'autoRenewProductId' in record) return 'renewalInfo';
  if ('transactionId' in record) return 'transaction';
  return 'unknown';
}

function environmentOf(payload: unknown): unknown {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const record = payload as Record<string, unknown>;
  const holder = ['data', 'summary', 'appData'].find(
    (key) => typeof record[key] === 'object' && record[key] !== null,
  );
  if (holder) return (record[holder] as Record<string, unknown>).environment;
  return record.environment ?? record.receiptType;
}

function bundleIdOf(payload: unknown): unknown {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const record = payload as Record<string, unknown>;
  for (const key of ['data', 'summary', 'appData', 'externalPurchaseToken']) {
    const holder = record[key];
    if (typeof holder === 'object' && holder !== null) {
      return (holder as Record<string, unknown>).bundleId;
    }
  }
  return record.bundleId;
}

function summarizeVerification(
  result: ChainVerification,
): NonNullable<DecodedPart['verification']> {
  return {
    ok: result.ok,
    ...(result.root ? { root: result.root.label } : {}),
    effectiveDate: result.effectiveDate.toISOString(),
    certificates: result.certificates,
  };
}

/** Decodes and checks the token in `input` and every JWS nested in it. */
export function decode(input: string, options: DecodeOptions = {}): DecodeResult {
  const { source, token } = findToken(input);
  const roots: TrustedRoot[] = [
    ...(options.withoutAppleRoot ? [] : [{ label: 'Apple Root CA - G3', der: APPLE_ROOT_CA_G3 }]),
    ...(options.roots ?? []),
  ];
  const result: DecodeResult = { source, parts: [], problems: [], notes: [], ok: true };
  const visit = (path: string, jws: string) => {
    let decoded: DecodedJws;
    try {
      decoded = decodeJws(jws);
    } catch (error) {
      if (error instanceof JwsError && path !== source) {
        result.notes.push(`${path} is not a readable JWS: ${error.message}.`);
        return;
      }
      throw new DecodeError((error as Error).message);
    }
    const tooDeep = deeperThan(decoded.payload, MAX_PAYLOAD_DEPTH);
    const payload = tooDeep
      ? `[payload nested more than ${MAX_PAYLOAD_DEPTH} levels deep, not shown]`
      : decoded.payload;
    if (tooDeep) {
      result.problems.push({
        path,
        code: 'deep-payload',
        message: `The payload holds arrays or objects nested more than ${MAX_PAYLOAD_DEPTH} levels deep; asnsim does not show or read it.`,
        fix: FIXES['deep-payload'],
      });
    }
    const part: DecodedPart = {
      path,
      kind: kindOf(payload),
      header: { alg: decoded.header.alg, x5c: decoded.x5c.length },
      payload,
    };
    const environment = environmentOf(payload);
    // The payload's own "environment" never turns the check off: anyone can write "Xcode" in it.
    if (options.verify === false) {
      part.skipped = 'not-requested';
    } else if (options.environment === XCODE) {
      part.skipped = 'xcode';
      result.problems.push({
        path,
        code: 'not-verified',
        message:
          'Not verified: --environment Xcode skips the signature and chain checks, as Apple’s SignedDataVerifier does when it is set up for the Xcode environment.',
        fix: FIXES['not-verified'],
      });
    } else {
      const verification = verifySignedData(decoded, roots, effectiveDateOf(payload));
      part.verification = summarizeVerification(verification);
      for (const problem of verification.problems) {
        result.problems.push({ path, ...problem, fix: FIXES[problem.code] });
      }
    }
    const bundleId = bundleIdOf(payload);
    if (options.bundleId !== undefined && bundleId !== undefined && bundleId !== options.bundleId) {
      result.problems.push({
        path,
        code: 'bundle-id-mismatch',
        message: `bundleId is ${JSON.stringify(bundleId)}, not ${options.bundleId}.`,
        fix: FIXES['bundle-id-mismatch'],
      });
    }
    if (
      options.environment !== undefined &&
      environment !== undefined &&
      environment !== options.environment
    ) {
      result.problems.push({
        path,
        code: 'environment-mismatch',
        message: `The environment is ${JSON.stringify(environment)}, not ${options.environment}.`,
        fix: FIXES['environment-mismatch'],
      });
    }
    result.parts.push(part);
    const unread = unreadJws(payload);
    if (unread.length > 0) {
      const listed = unread.slice(0, LISTED_UNREAD).join(', ');
      const more =
        unread.length > LISTED_UNREAD ? `, and ${unread.length - LISTED_UNREAD} more` : '';
      result.problems.push({
        path,
        code: 'unread-jws',
        message: `${unread.length === 1 ? 'A JWS was' : `${unread.length} JWS were`} not decoded: ${listed}${more}. asnsim decodes nested JWS only in data.signedTransactionInfo, data.signedRenewalInfo and data.signedAppTransactionInfo (or appData.…).`,
        fix: FIXES['unread-jws'],
      });
    }
    if (typeof payload !== 'object' || payload === null) return;
    const record = payload as Record<string, unknown>;
    for (const holderKey of ['data', 'appData']) {
      const holder = record[holderKey];
      if (typeof holder !== 'object' || holder === null) continue;
      for (const [field] of NESTED) {
        const value = (holder as Record<string, unknown>)[field];
        if (typeof value === 'string') visit(`${holderKey}.${field}`, value);
      }
    }
  };
  visit(source, token);
  const claimsXcode = result.parts.some((part) => environmentOf(part.payload) === XCODE);
  if (claimsXcode && options.environment !== XCODE && options.verify !== false) {
    result.notes.push(
      'The payload says environment Xcode. Data from StoreKit Testing in Xcode is signed by Xcode, not the App Store, so it does not verify; pass --environment Xcode to read it without the checks.',
    );
  }
  result.ok = result.problems.length === 0;
  return result;
}

/** Fields holding UNIX times in milliseconds, shown as dates in the text reports. */
export const DATE_FIELDS = new Set([
  'signedDate',
  'purchaseDate',
  'originalPurchaseDate',
  'expiresDate',
  'revocationDate',
  'gracePeriodExpiresDate',
  'recentSubscriptionStartDate',
  'renewalDate',
  'tokenCreationDate',
  'tokenExpirationDate',
  'receiptCreationDate',
  'preorderDate',
]);
