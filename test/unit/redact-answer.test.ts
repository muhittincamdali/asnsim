import { describe, expect, it } from 'vitest';
import { redactAnswer } from '../../src/redact/body.js';
import { mediaType } from '../../src/redact/media.js';

// A webhook's answer is read the way its Content-Type says (REDACTION-SPEC §4 B0, KL-D1): JSON as
// JSON, text/plain as free text, and every other body left out of the report, as is a body with
// no content type, an unreadable one, a charset other than UTF-8 or US-ASCII, bytes that are not
// UTF-8 and a body cut at 64 KB.

const R = '[redacted]';
const answer = (body: string | Uint8Array, contentType: string | null, cut = false) =>
  redactAnswer({
    bytes: typeof body === 'string' ? Buffer.from(body) : body,
    contentType,
    cut,
  });

describe('the content type of an answer (B0)', () => {
  it('reads JSON types as JSON', () => {
    for (const type of [
      'application/json',
      'Application/JSON; charset=UTF-8',
      'application/json;charset="utf-8"',
      'text/json',
      'application/problem+json',
      'application/vnd.api+json; ext=bulk',
    ]) {
      expect(answer('{"user":"bob","password":"hunter2"}', type), type).toBe(
        `{"user":"bob","password":"${R}"}`,
      );
    }
  });

  it('reads text/plain as free text', () => {
    expect(answer('denied password=hunter2', 'text/plain; charset=us-ascii')).toBe(
      `denied password=${R}`,
    );
  });

  it('leaves out every other type, with the type as the note', () => {
    for (const [body, type] of [
      ['Qx847Np7v', 'application/octet-stream'],
      ['<p>Qx847Np7v</p>', 'text/html; charset=utf-8'],
      ['password=Qx847Np7v', 'application/x-www-form-urlencoded'],
      ['--b\r\n\r\nQx847Np7v\r\n--b--', 'multipart/form-data; boundary=b'],
      ['{"x":"Qx847Np7v"}', 'application/x-json'],
      ['{"x":"Qx847Np7v"}', 'application/jsonx'],
    ] as const) {
      const shown = type.split(';')[0];
      expect(answer(body, type), type).toBe(
        `[body omitted: ${Buffer.byteLength(body)} bytes, ${shown}]`,
      );
    }
  });

  it('leaves out a body without a content type', () => {
    expect(answer('{"x":"Qx371Np7v"}', null)).toBe('[body omitted: 17 bytes, no content type]');
  });

  it('leaves out a body whose content type does not read strictly', () => {
    for (const type of [
      'application/json, text/plain',
      'text/plain, application/json',
      'application/json; charset = utf-8',
      'application/json;',
      'application/json\u0000',
      'application/json\r\nx: y',
      'application/json; charset="utf-8',
      'json',
      '*/*;q=',
      '',
    ]) {
      expect(answer('{"x":"Qx366Np7v"}', type), JSON.stringify(type)).toBe(
        '[body omitted: 17 bytes, unreadable content type]',
      );
    }
  });

  it('leaves out a body that is not UTF-8, or that its charset says is not', () => {
    expect(answer('{"x":"Qx367Np7v"}', 'application/json; charset=utf-8; charset=latin1')).toBe(
      '[body omitted: 17 bytes, application/json]',
    );
    expect(answer('{"x":"Qx367Np7v"}', 'application/json; charset=utf-8; charset=utf-8')).toBe(
      '[body omitted: 17 bytes, application/json]',
    );
    expect(answer('{"x":"Qx367Np7v"}', 'application/json; charset=iso-8859-1')).toBe(
      '[body omitted: 17 bytes, application/json]',
    );
    const latin1 = Buffer.from('{"x":"Qx\xe9367"}', 'latin1');
    expect(answer(latin1, 'application/json')).toBe(
      `[body omitted: ${latin1.length} bytes, application/json]`,
    );
  });

  it('leaves out a body cut at 64 KB, and shows an empty one as empty', () => {
    const kept = Buffer.from(`${'ok '.repeat(21_845)}x`);
    expect(answer(kept, 'text/plain', true)).toBe(
      '[body omitted: more than 65536 bytes, text/plain]',
    );
    expect(answer(kept, 'text/plain')).toBe(kept.toString());
    expect(answer('', null)).toBe('');
    expect(answer('', 'application/json')).toBe('');
  });

  it('reads parameters as token=token or token="quoted"', () => {
    expect(mediaType('text/plain; format=flowed; charset="US-ASCII"')).toEqual({
      type: 'text/plain',
      utf8: true,
    });
    expect(mediaType('text/plain; charset=utf8')).toEqual({ type: 'text/plain', utf8: false });
    expect(mediaType('text/plain; name="a\\"b"')).toEqual({ type: 'text/plain', utf8: true });
    expect(mediaType('text/plain; name=a b')).toBeUndefined();
  });
});
