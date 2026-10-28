import { X509Certificate } from 'node:crypto';
import { type DecodedJws, verifyEs256 } from '../jws/jws.js';
import { type CertificateInfo, hasExtension, OID, readCertificate } from './certificate.js';

// The checks Apple's App Store Server Libraries make before they trust signed data
// (SignedDataVerifier with online checks off), in the same order:
//
// 1. x5c holds exactly three certificates; the third is not used, the trusted roots are.
// 2. The intermediate is signed by a trusted root and names it as issuer.
// 3. The signing certificate is signed by the intermediate and names it as issuer.
// 4. The intermediate is a CA.
// 5. The signing certificate has the receipt signing extension (1.2.840.113635.100.6.11.1) and
//    the intermediate the WWDR extension (1.2.840.113635.100.6.2.1).
// 6. The signing certificate, the intermediate and the root are valid at the effective date: the
//    payload's signedDate when there is one.
// 7. The JWS signature (ES256) verifies with the signing certificate's key.
//
// Revocation (OCSP) needs the network and is not checked; asnsim reads nothing online.

export interface TrustedRoot {
  /** Shown in reports: "Apple Root CA - G3", "asnsim test root (.asnsim/root.cer)", a file name. */
  label: string;
  der: Uint8Array;
}

export type ProblemCode =
  | 'unsupported-algorithm'
  | 'chain-length'
  | 'unreadable-certificate'
  | 'untrusted-root'
  | 'not-issued-by-intermediate'
  | 'intermediate-not-ca'
  | 'missing-signing-extension'
  | 'missing-intermediate-extension'
  | 'not-valid-at-date'
  | 'bad-signature';

export interface Problem {
  code: ProblemCode;
  message: string;
}

export interface ChainVerification {
  ok: boolean;
  /** The trusted root the intermediate chains to, when one does. */
  root?: TrustedRoot;
  /** The certificates of x5c that could be read, leaf first. */
  certificates: CertificateInfo[];
  effectiveDate: Date;
  problems: Problem[];
}

function x509(der: Uint8Array): X509Certificate | undefined {
  try {
    return new X509Certificate(der);
  } catch {
    return undefined;
  }
}

function validAt(info: CertificateInfo, date: Date): boolean {
  return info.notBefore.getTime() <= date.getTime() && date.getTime() <= info.notAfter.getTime();
}

/** Verifies a decoded JWS and its x5c chain against `roots` at `effectiveDate`. */
export function verifySignedData(
  decoded: DecodedJws,
  roots: TrustedRoot[],
  effectiveDate: Date,
): ChainVerification {
  const problems: Problem[] = [];
  const certificates: CertificateInfo[] = [];
  for (const der of decoded.x5c) {
    try {
      certificates.push(readCertificate(der));
    } catch {
      break;
    }
  }
  const result = (root?: TrustedRoot): ChainVerification => ({
    ok: problems.length === 0,
    ...(root ? { root } : {}),
    certificates,
    effectiveDate,
    problems,
  });
  if (decoded.header.alg !== 'ES256') {
    problems.push({
      code: 'unsupported-algorithm',
      message: `The header's alg is ${JSON.stringify(decoded.header.alg)}; App Store data uses ES256.`,
    });
  }
  if (decoded.x5c.length !== 3) {
    problems.push({
      code: 'chain-length',
      message: `x5c holds ${decoded.x5c.length} certificate(s); App Store data carries 3 (signing certificate, intermediate, root).`,
    });
    return result();
  }
  const [leafDer, intermediateDer] = decoded.x5c as [Uint8Array, Uint8Array, Uint8Array];
  const leaf = x509(leafDer);
  const intermediate = x509(intermediateDer);
  const [leafInfo, intermediateInfo] = certificates;
  if (!leaf || !intermediate || !leafInfo || !intermediateInfo) {
    problems.push({
      code: 'unreadable-certificate',
      message: 'The first two certificates of x5c are not both readable X.509 certificates.',
    });
    return result();
  }

  let root: TrustedRoot | undefined;
  let rootInfo: CertificateInfo | undefined;
  for (const candidate of roots) {
    const certificate = x509(candidate.der);
    if (!certificate) continue;
    if (intermediate.issuer === certificate.subject && intermediate.verify(certificate.publicKey)) {
      root = candidate;
      rootInfo = readCertificate(candidate.der);
      break;
    }
  }
  if (!root) {
    problems.push({
      code: 'untrusted-root',
      message: `The intermediate (${intermediateInfo.subject.CN ?? 'no name'}) is not issued by a trusted root: ${roots.map((entry) => entry.label).join(', ') || 'none given'}.`,
    });
  }
  if (!(leaf.issuer === intermediate.subject && leaf.verify(intermediate.publicKey))) {
    problems.push({
      code: 'not-issued-by-intermediate',
      message: 'The signing certificate is not issued by the intermediate that follows it.',
    });
  }
  if (!intermediate.ca) {
    problems.push({
      code: 'intermediate-not-ca',
      message: 'The intermediate is not a CA certificate.',
    });
  }
  if (!hasExtension(leafInfo, OID.appleReceiptSigning)) {
    problems.push({
      code: 'missing-signing-extension',
      message: `The signing certificate lacks the receipt signing extension ${OID.appleReceiptSigning}.`,
    });
  }
  if (!hasExtension(intermediateInfo, OID.appleWwdrIntermediate)) {
    problems.push({
      code: 'missing-intermediate-extension',
      message: `The intermediate lacks the WWDR extension ${OID.appleWwdrIntermediate}.`,
    });
  }
  const dated: [string, CertificateInfo | undefined][] = [
    ['signing certificate', leafInfo],
    ['intermediate', intermediateInfo],
    ['root', rootInfo],
  ];
  for (const [what, info] of dated) {
    if (info && !validAt(info, effectiveDate)) {
      problems.push({
        code: 'not-valid-at-date',
        message: `The ${what} is valid from ${info.notBefore.toISOString()} to ${info.notAfter.toISOString()}, not at ${effectiveDate.toISOString()}.`,
      });
    }
  }
  if (!verifyEs256(decoded, leaf.publicKey)) {
    problems.push({
      code: 'bad-signature',
      message: 'The JWS signature does not verify with the signing certificate.',
    });
  }
  return result(root);
}

/**
 * The date Apple's libraries check certificates at with online checks off: signedDate (an app
 * transaction's receiptCreationDate), else the current time.
 */
export function effectiveDateOf(payload: unknown, now: Date = new Date()): Date {
  if (typeof payload === 'object' && payload !== null) {
    const { signedDate, receiptCreationDate } = payload as Record<string, unknown>;
    for (const value of [signedDate, receiptCreationDate]) {
      if (typeof value === 'number' && Number.isFinite(value)) return new Date(value);
    }
  }
  return now;
}
