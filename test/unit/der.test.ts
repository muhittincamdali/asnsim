import { describe, expect, it } from 'vitest';
import {
  DerError,
  oid,
  parse,
  readOid,
  readTime,
  sequence,
  smallInteger,
  time,
  tlv,
  unsignedInteger,
  utf8String,
} from '../../src/pki/der.js';

const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

describe('DER writing', () => {
  it('encodes short and long lengths', () => {
    expect(hex(tlv(0x04, new Uint8Array(3)))).toBe('0403000000');
    expect(hex(tlv(0x04, new Uint8Array(200))).slice(0, 6)).toBe('0481c8');
    expect(hex(tlv(0x04, new Uint8Array(300))).slice(0, 8)).toBe('0482012c');
  });

  it('encodes integers without redundant zeros and with a sign byte when needed', () => {
    expect(hex(smallInteger(0))).toBe('020100');
    expect(hex(smallInteger(2))).toBe('020102');
    expect(hex(smallInteger(128))).toBe('02020080');
    expect(hex(unsignedInteger(Uint8Array.of(0, 0, 0x7f)))).toBe('02017f');
    expect(hex(unsignedInteger(Uint8Array.of(0xff)))).toBe('020200ff');
  });

  it('encodes object identifiers, including multi-byte arcs', () => {
    expect(hex(oid('1.2.840.10045.4.3.2'))).toBe('06082a8648ce3d040302');
    expect(hex(oid('1.2.840.113635.100.6.11.1'))).toBe('060a2a864886f76364060b01');
    expect(hex(oid('2.5.29.19'))).toBe('0603551d13');
  });

  it('writes UTCTime before 2050 and GeneralizedTime from 2050', () => {
    expect(Buffer.from(time(new Date('2026-10-28T09:30:05Z'))).toString('latin1')).toContain(
      '261028093005Z',
    );
    const late = time(new Date('2051-01-02T03:04:05Z'));
    expect(late[0]).toBe(0x18);
    expect(Buffer.from(late).toString('latin1')).toContain('20510102030405Z');
  });
});

describe('DER reading', () => {
  it('reads back what it writes', () => {
    const node = parse(sequence(oid('1.2.840.113635.100.6.2.1'), utf8String('Test')));
    expect(node.children).toHaveLength(2);
    const [first, second] = node.children;
    expect(first && readOid(first)).toBe('1.2.840.113635.100.6.2.1');
    expect(second && Buffer.from(second.content).toString()).toBe('Test');
  });

  it('reads both time forms', () => {
    for (const iso of [
      '1999-12-31T23:59:59.000Z',
      '2026-10-28T09:30:05.000Z',
      '2051-01-02T03:04:05.000Z',
    ]) {
      expect(readTime(parse(time(new Date(iso)))).toISOString()).toBe(iso);
    }
  });

  it('rejects truncated, trailing and oversized data', () => {
    expect(() => parse(Uint8Array.of(0x30, 0x05, 0x01))).toThrow(DerError);
    expect(() => parse(Uint8Array.of(0x05, 0x00, 0x00))).toThrow('Data follows');
    expect(() => parse(Uint8Array.of(0x04, 0x85, 1, 1, 1, 1, 1))).toThrow('unsupported length');
    expect(() => parse(Uint8Array.of(0x1f, 0x00))).toThrow('multi-byte tag');
    expect(() => parse(Uint8Array.of(0x30))).toThrow('inside a header');
  });

  it('stops at 32 levels of nesting', () => {
    let node: Uint8Array = Uint8Array.of(0x05, 0x00);
    for (let depth = 0; depth < 40; depth++) node = sequence(node);
    expect(() => parse(node)).toThrow('nests too deeply');
  });
});
