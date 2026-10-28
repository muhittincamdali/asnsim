import { createHash, type KeyObject, sign } from 'node:crypto';
import {
  bitString,
  boolean,
  DerError,
  explicit,
  implicit,
  type Node,
  nullValue,
  octetString,
  oid,
  parse,
  printableString,
  readOid,
  readString,
  readTime,
  sequence,
  set,
  smallInteger,
  TAG,
  time,
  unsignedInteger,
  utf8String,
} from './der.js';

/** Object identifiers asnsim writes or reads. */
export const OID = {
  ecdsaWithSha256: '1.2.840.10045.4.3.2',
  commonName: '2.5.4.3',
  country: '2.5.4.6',
  organization: '2.5.4.10',
  organizationalUnit: '2.5.4.11',
  basicConstraints: '2.5.29.19',
  keyUsage: '2.5.29.15',
  subjectKeyIdentifier: '2.5.29.14',
  authorityKeyIdentifier: '2.5.29.35',
  /**
   * Marks the certificate that signs App Store data ("Mac App Store Receipt Signing"). Apple's
   * server libraries require it on the first certificate of the x5c chain.
   */
  appleReceiptSigning: '1.2.840.113635.100.6.11.1',
  /** Marks an Apple Worldwide Developer Relations intermediate; required on the second. */
  appleWwdrIntermediate: '1.2.840.113635.100.6.2.1',
} as const;

const NAME_OIDS: Record<string, string> = {
  [OID.commonName]: 'CN',
  [OID.organizationalUnit]: 'OU',
  [OID.organization]: 'O',
  [OID.country]: 'C',
};

/** A distinguished name, written in the order given (CN, OU, O, C as Apple's certificates do). */
export interface Name {
  CN: string;
  OU?: string;
  O?: string;
  C?: string;
}

function encodeName(name: Name): Uint8Array {
  const attributes: [string, string | undefined][] = [
    [OID.commonName, name.CN],
    [OID.organizationalUnit, name.OU],
    [OID.organization, name.O],
    [OID.country, name.C],
  ];
  return sequence(
    ...attributes
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(([type, value]) =>
        set(sequence(oid(type), type === OID.country ? printableString(value) : utf8String(value))),
      ),
  );
}

/** RFC 5280 method 1: SHA-1 of the subjectPublicKey bit string. */
export function keyIdentifier(publicKey: KeyObject): Uint8Array {
  const spki = parse(publicKey.export({ type: 'spki', format: 'der' }));
  const key = spki.children[1];
  if (!key) throw new DerError('SubjectPublicKeyInfo has no key');
  return createHash('sha1').update(key.content.subarray(1)).digest();
}

const extension = (id: string, critical: boolean, value: Uint8Array) =>
  critical
    ? sequence(oid(id), boolean(true), octetString(value))
    : sequence(oid(id), octetString(value));

export interface CertificateSpec {
  subject: Name;
  issuer: Name;
  /** Key the certificate is for. */
  publicKey: KeyObject;
  /** The issuer's private key; the subject's own key for a self-signed root. */
  signingKey: KeyObject;
  /** The issuer's public key, for the authority key identifier. */
  issuerPublicKey: KeyObject;
  serial: Uint8Array;
  notBefore: Date;
  notAfter: Date;
  /** A CA certificate (root or intermediate) or the end-entity certificate that signs data. */
  ca: boolean;
  /** For a CA: how many CA certificates may follow it in a chain (none: no limit). */
  pathLength?: number;
  /** Apple extension to add with a NULL value, as Apple's own certificates carry it. */
  appleExtension?: string;
}

/** A DER X.509 v3 certificate signed with ECDSA P-256 and SHA-256. */
export function buildCertificate(spec: CertificateSpec): Uint8Array {
  const algorithm = sequence(oid(OID.ecdsaWithSha256));
  const extensions = [
    extension(
      OID.basicConstraints,
      true,
      spec.ca
        ? sequence(
            boolean(true),
            ...(spec.pathLength === undefined ? [] : [smallInteger(spec.pathLength)]),
          )
        : sequence(),
    ),
    // keyCertSign and cRLSign (bits 5 and 6) for a CA, digitalSignature (bit 0) otherwise.
    extension(
      OID.keyUsage,
      true,
      spec.ca ? bitString(Uint8Array.of(0x06), 1) : bitString(Uint8Array.of(0x80), 7),
    ),
    extension(OID.subjectKeyIdentifier, false, octetString(keyIdentifier(spec.publicKey))),
    extension(
      OID.authorityKeyIdentifier,
      false,
      sequence(implicit(0, keyIdentifier(spec.issuerPublicKey))),
    ),
  ];
  if (spec.appleExtension) extensions.push(extension(spec.appleExtension, false, nullValue()));
  const tbs = sequence(
    explicit(0, smallInteger(2)),
    unsignedInteger(spec.serial),
    algorithm,
    encodeName(spec.issuer),
    sequence(time(spec.notBefore), time(spec.notAfter)),
    encodeName(spec.subject),
    spec.publicKey.export({ type: 'spki', format: 'der' }),
    explicit(3, sequence(...extensions)),
  );
  const signature = sign('sha256', tbs, spec.signingKey);
  return sequence(tbs, algorithm, bitString(signature));
}

export interface Extension {
  oid: string;
  critical: boolean;
  value: Uint8Array;
}

/** The fields of a certificate that asnsim shows and checks. */
export interface CertificateInfo {
  der: Uint8Array;
  subject: Record<string, string>;
  issuer: Record<string, string>;
  serialNumber: string;
  notBefore: Date;
  notAfter: Date;
  isCa: boolean;
  extensions: Extension[];
  /** SHA-256 of the DER bytes, upper-case hex pairs separated by colons. */
  sha256: string;
}

function decodeName(node: Node): Record<string, string> {
  const name: Record<string, string> = {};
  for (const rdn of node.children) {
    for (const attribute of rdn.children) {
      const [type, value] = attribute.children;
      if (!type || !value) continue;
      const id = readOid(type);
      name[NAME_OIDS[id] ?? id] = readString(value);
    }
  }
  return name;
}

export function fingerprint(der: Uint8Array): string {
  return createHash('sha256')
    .update(der)
    .digest('hex')
    .toUpperCase()
    .replace(/(..)(?!$)/g, '$1:');
}

/** Reads a DER certificate; throws DerError when it is not one. */
export function readCertificate(der: Uint8Array): CertificateInfo {
  const certificate = parse(der);
  const tbs = certificate.children[0];
  if (certificate.tag !== TAG.sequence || !tbs || tbs.tag !== TAG.sequence) {
    throw new DerError('Not an X.509 certificate');
  }
  const fields = tbs.children[0]?.tag === 0xa0 ? tbs.children.slice(1) : tbs.children;
  const [serial, , issuer, validity, subject] = fields;
  if (!serial || !issuer || !validity || !subject) throw new DerError('Certificate is incomplete');
  const [notBefore, notAfter] = validity.children;
  if (!notBefore || !notAfter) throw new DerError('Certificate has no validity');
  const extensionsNode = fields.find((node) => node.tag === 0xa3)?.children[0];
  const extensions: Extension[] = (extensionsNode?.children ?? []).map((node) => {
    const [id, second, third] = node.children;
    if (!id || !second) throw new DerError('Malformed extension');
    const critical = second.tag === TAG.boolean ? second.content[0] !== 0 : false;
    const value = second.tag === TAG.boolean ? third : second;
    if (!value) throw new DerError('Extension has no value');
    return { oid: readOid(id), critical, value: value.content };
  });
  const constraints = extensions.find((entry) => entry.oid === OID.basicConstraints);
  const cA = constraints ? parse(constraints.value).children[0] : undefined;
  const isCa = cA?.tag === TAG.boolean && cA.content[0] !== 0;
  return {
    der,
    subject: decodeName(subject),
    issuer: decodeName(issuer),
    serialNumber: Buffer.from(serial.content).toString('hex').toUpperCase(),
    notBefore: readTime(notBefore),
    notAfter: readTime(notAfter),
    isCa,
    extensions,
    sha256: fingerprint(der),
  };
}

export function hasExtension(info: CertificateInfo, id: string): boolean {
  return info.extensions.some((entry) => entry.oid === id);
}

/** A name as one line, CN first: "CN=…, OU=…, O=…, C=…". */
export function formatName(name: Record<string, string>): string {
  return Object.entries(name)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

export function toPem(der: Uint8Array, label = 'CERTIFICATE'): string {
  const base64 = Buffer.from(der).toString('base64');
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}

/** Every certificate in PEM text, or the bytes themselves when they are DER. */
export function readCertificates(bytes: Uint8Array): Uint8Array[] {
  const text = Buffer.from(bytes).toString('latin1');
  const blocks = [
    ...text.matchAll(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/g),
  ];
  if (blocks.length === 0) return [bytes];
  return blocks.map((block) => Uint8Array.from(Buffer.from(block[1] ?? '', 'base64')));
}
