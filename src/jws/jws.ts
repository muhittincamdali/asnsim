import { type KeyObject, sign, verify } from 'node:crypto';

// JSON Web Signature in compact serialization (RFC 7515) with ES256, the format of signedPayload,
// signedTransactionInfo and signedRenewalInfo. The header carries the signing certificate chain
// in x5c, leaf first, as standard base64 DER (RFC 7515 section 4.1.6).

export class JwsError extends Error {
  override name = 'JwsError';
}

/** Longest token asnsim decodes. Apple's payloads are a few kilobytes. */
export const MAX_JWS_LENGTH = 1_000_000;

export interface JwsHeader {
  alg?: unknown;
  x5c?: unknown;
  [key: string]: unknown;
}

export interface DecodedJws {
  header: JwsHeader;
  payload: unknown;
  /** The certificates of x5c, decoded from base64; empty when the header has none. */
  x5c: Uint8Array[];
  signingInput: string;
  signature: Uint8Array;
}

const base64url = (bytes: Uint8Array | string) => Buffer.from(bytes).toString('base64url');

/** Signs `payload` as a compact JWS with ES256 and the given chain in x5c (leaf first). */
export function signJws(payload: unknown, key: KeyObject, chain: Uint8Array[]): string {
  const header = { alg: 'ES256', x5c: chain.map((der) => Buffer.from(der).toString('base64')) };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${base64url(signature)}`;
}

const BASE64URL = /^[A-Za-z0-9_-]*$/;

function decodeJson(part: string, what: string): unknown {
  if (!BASE64URL.test(part)) throw new JwsError(`The ${what} is not base64url`);
  const text = Buffer.from(part, 'base64url').toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw new JwsError(`The ${what} is not JSON`);
  }
}

/** True when `text` has the shape of a compact JWS: three base64url parts. */
export function looksLikeJws(text: string): boolean {
  const parts = text.split('.');
  return parts.length === 3 && parts.every((part) => BASE64URL.test(part)) && parts[0] !== '';
}

/** Splits and decodes a compact JWS without checking its signature. */
export function decodeJws(token: string): DecodedJws {
  if (token.length > MAX_JWS_LENGTH) {
    throw new JwsError(`The JWS is longer than ${MAX_JWS_LENGTH} characters`);
  }
  const parts = token.split('.');
  if (parts.length !== 3) throw new JwsError('A JWS has three parts separated by dots');
  const [headerPart = '', payloadPart = '', signaturePart = ''] = parts;
  const header = decodeJson(headerPart, 'JWS header');
  if (typeof header !== 'object' || header === null || Array.isArray(header)) {
    throw new JwsError('The JWS header is not a JSON object');
  }
  const payload = decodeJson(payloadPart, 'JWS payload');
  if (!BASE64URL.test(signaturePart)) throw new JwsError('The JWS signature is not base64url');
  const { x5c } = header as JwsHeader;
  const chain =
    Array.isArray(x5c) && x5c.every((entry) => typeof entry === 'string')
      ? x5c.map((entry: string) => Uint8Array.from(Buffer.from(entry, 'base64')))
      : [];
  return {
    header: header as JwsHeader,
    payload,
    x5c: chain,
    signingInput: `${headerPart}.${payloadPart}`,
    signature: Uint8Array.from(Buffer.from(signaturePart, 'base64url')),
  };
}

/** Checks an ES256 signature (64 bytes, r then s) with `key`, the signing certificate's key. */
export function verifyEs256(decoded: DecodedJws, key: KeyObject): boolean {
  if (decoded.signature.length !== 64) return false;
  try {
    return verify(
      'sha256',
      Buffer.from(decoded.signingInput),
      { key, dsaEncoding: 'ieee-p1363' },
      decoded.signature,
    );
  } catch {
    return false;
  }
}
