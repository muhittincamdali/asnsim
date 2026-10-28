// The small part of ASN.1 DER that X.509 certificates need: enough to write the three certificates
// of a test chain and to read the fields a verifier checks (names, validity, extensions) from any
// certificate, Apple's included. Node.js parses certificates (X509Certificate) but cannot write
// them, and it does not list extensions by OID.

export const TAG = {
  boolean: 0x01,
  integer: 0x02,
  bitString: 0x03,
  octetString: 0x04,
  null: 0x05,
  oid: 0x06,
  utf8String: 0x0c,
  printableString: 0x13,
  utcTime: 0x17,
  generalizedTime: 0x18,
  sequence: 0x30,
  set: 0x31,
} as const;

function lengthBytes(length: number): number[] {
  if (length < 0x80) return [length];
  const bytes: number[] = [];
  for (let rest = length; rest > 0; rest = Math.floor(rest / 256)) bytes.unshift(rest % 256);
  return [0x80 | bytes.length, ...bytes];
}

/** One tag-length-value element. */
export function tlv(tag: number, content: Uint8Array): Uint8Array {
  return Uint8Array.from([tag, ...lengthBytes(content.length), ...content]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export const sequence = (...items: Uint8Array[]) => tlv(TAG.sequence, concat(items));
export const set = (...items: Uint8Array[]) => tlv(TAG.set, concat(items));
export const octetString = (bytes: Uint8Array) => tlv(TAG.octetString, bytes);
export const nullValue = () => tlv(TAG.null, new Uint8Array());
export const boolean = (value: boolean) => tlv(TAG.boolean, Uint8Array.of(value ? 0xff : 0x00));
export const utf8String = (text: string) => tlv(TAG.utf8String, new TextEncoder().encode(text));
export const printableString = (text: string) =>
  tlv(TAG.printableString, new TextEncoder().encode(text));

/** A context-specific constructed element, `[n] EXPLICIT`. */
export const explicit = (n: number, content: Uint8Array) => tlv(0xa0 | n, content);
/** A context-specific primitive element, `[n] IMPLICIT` of a primitive type. */
export const implicit = (n: number, content: Uint8Array) => tlv(0x80 | n, content);

/** A non-negative INTEGER from big-endian bytes, without redundant leading zeros. */
export function unsignedInteger(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) start++;
  const trimmed = bytes.subarray(start);
  const content = (trimmed[0] ?? 0) & 0x80 ? concat([Uint8Array.of(0), trimmed]) : trimmed;
  return tlv(TAG.integer, content.length === 0 ? Uint8Array.of(0) : content);
}

export const smallInteger = (value: number) => {
  const bytes: number[] = [];
  for (let rest = value; rest > 0; rest = Math.floor(rest / 256)) bytes.unshift(rest % 256);
  return unsignedInteger(Uint8Array.from(bytes.length ? bytes : [0]));
};

/** A BIT STRING whose last `unusedBits` bits are padding. */
export const bitString = (bytes: Uint8Array, unusedBits = 0) =>
  tlv(TAG.bitString, concat([Uint8Array.of(unusedBits), bytes]));

export function oid(dotted: string): Uint8Array {
  const parts = dotted.split('.').map(Number);
  const [first = 0, second = 0, ...rest] = parts;
  const bytes = [first * 40 + second];
  for (const part of rest) {
    const chunk: number[] = [part & 0x7f];
    for (let value = Math.floor(part / 128); value > 0; value = Math.floor(value / 128)) {
      chunk.unshift(0x80 | (value & 0x7f));
    }
    bytes.push(...chunk);
  }
  return tlv(TAG.oid, Uint8Array.from(bytes));
}

/** UTCTime up to 2049, GeneralizedTime from 2050, as RFC 5280 section 4.1.2.5 requires. */
export function time(date: Date): Uint8Array {
  const iso = date.toISOString();
  const digits = `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`;
  const year = date.getUTCFullYear();
  if (year >= 1950 && year < 2050) {
    return tlv(TAG.utcTime, new TextEncoder().encode(digits.slice(2)));
  }
  return tlv(TAG.generalizedTime, new TextEncoder().encode(digits));
}

/** One element read from DER bytes. `content` is a view into the input. */
export interface Node {
  tag: number;
  /** The whole element, header included. */
  bytes: Uint8Array;
  content: Uint8Array;
  /** Children of a constructed element (SEQUENCE, SET, [n] EXPLICIT); empty otherwise. */
  children: Node[];
}

export class DerError extends Error {
  override name = 'DerError';
}

const MAX_DEPTH = 32;

function readNode(bytes: Uint8Array, offset: number, depth: number): Node {
  if (depth > MAX_DEPTH) throw new DerError('DER nests too deeply');
  const tag = bytes[offset];
  const first = bytes[offset + 1];
  if (tag === undefined || first === undefined) throw new DerError('DER ends inside a header');
  if ((tag & 0x1f) === 0x1f) throw new DerError('DER uses a multi-byte tag');
  let length = first;
  let header = 2;
  if (first & 0x80) {
    const count = first & 0x7f;
    if (count === 0 || count > 4) throw new DerError('DER uses an unsupported length');
    length = 0;
    for (let index = 0; index < count; index++) {
      const byte = bytes[offset + 2 + index];
      if (byte === undefined) throw new DerError('DER ends inside a length');
      length = length * 256 + byte;
    }
    header += count;
  }
  const end = offset + header + length;
  if (end > bytes.length) throw new DerError('DER element runs past the end of the data');
  const content = bytes.subarray(offset + header, end);
  const children: Node[] = [];
  if (tag & 0x20) {
    let position = 0;
    while (position < content.length) {
      const child = readNode(content, position, depth + 1);
      children.push(child);
      position += child.bytes.length;
    }
  }
  return { tag, bytes: bytes.subarray(offset, end), content, children };
}

/** Reads one DER element that must fill `bytes` exactly. */
export function parse(bytes: Uint8Array): Node {
  const node = readNode(bytes, 0, 0);
  if (node.bytes.length !== bytes.length) throw new DerError('Data follows the DER element');
  return node;
}

export function readOid(node: Node): string {
  if (node.tag !== TAG.oid) throw new DerError('Expected an OBJECT IDENTIFIER');
  const parts: number[] = [];
  let value = 0;
  for (const byte of node.content) {
    value = value * 128 + (byte & 0x7f);
    if (byte & 0x80) continue;
    if (parts.length === 0) {
      const first = value < 80 ? Math.floor(value / 40) : 2;
      parts.push(first, value - first * 40);
    } else {
      parts.push(value);
    }
    value = 0;
  }
  return parts.join('.');
}

export function readString(node: Node): string {
  return new TextDecoder().decode(node.content);
}

/** UTCTime or GeneralizedTime (whole seconds, `Z`) as a Date. */
export function readTime(node: Node): Date {
  const text = readString(node);
  const full =
    node.tag === TAG.utcTime ? `${Number(text.slice(0, 2)) < 50 ? '20' : '19'}${text}` : text;
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(full);
  if (!match) throw new DerError(`Unsupported time: ${text}`);
  const [, year, month, day, hour, minute, second] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}
