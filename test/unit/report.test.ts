import { describe, expect, it } from 'vitest';
import { decode } from '../../src/decode/decode.js';
import { signJws } from '../../src/jws/jws.js';
import { createTestChain } from '../../src/pki/chain.js';
import { rows, renderDecode } from '../../src/report/decode.js';
import { renderRun } from '../../src/report/run.js';
import { clean, cut, markdownCode, markdownText, oneLine, wrap } from '../../src/report/style.js';
import type { RunResult } from '../../src/run/run.js';
import { finding } from '../../src/run/findings.js';

describe('text helpers', () => {
  it('shows control characters instead of printing them', () => {
    expect(clean('ok\u001b[31mred\u0007')).toBe('ok<U+001B>[31mred<U+0007>');
    expect(clean('a‮b⁦c')).toBe('a<U+202E>b<U+2066>c');
    expect(clean('two\nlines')).toBe('two\nlines');
    expect(clean('a\u2028b\u2029c\u0085d')).toBe('a<U+2028>b<U+2029>c<U+0085>d');
    expect(oneLine('two\r\nlines\tand tab')).toBe('two lines and tab');
  });

  it('cuts, wraps and escapes', () => {
    expect(cut('abcdef', 4)).toBe('abc…');
    expect(wrap('one two three four', 10, '  ', 0)).toBe('one two\n  three\n  four');
    expect(markdownText('a|b *c* <d>')).toBe('a\\|b \\*c\\* \\<d\\>');
  });
});

const result = (body: string): RunResult => ({
  scenario: 'evil',
  url: 'http://127.0.0.1/x',
  clock: 'live',
  dryRun: false,
  bundleId: 'com.example.app',
  environment: 'Sandbox',
  ok: false,
  counts: { steps: 1, passed: 0, failed: 1, requests: 1 },
  steps: [
    {
      index: 1,
      name: 'TEST',
      type: 'TEST',
      subtype: null,
      access: 'unchanged',
      at: '2026-10-01T09:00:00.000Z',
      signedDate: '2026-10-01T09:00:00.000Z',
      notificationUUID: 'u',
      attempts: [{ attempt: 1, kind: 'send', status: 500, body, ms: 1 }],
      findings: [
        finding(
          'rejected',
          'The webhook answered 500: the App Store would count the delivery as failed.',
        ),
      ],
      ok: false,
    },
  ],
});

describe('renderRun', () => {
  it('cleans what the webhook answered in every text format', () => {
    const body = 'oops\u001b]0;owned\u0007\nsecond line';
    for (const format of ['tty', 'text', 'markdown'] as const) {
      const text = renderRun(result(body), format, { color: true });
      expect(text, format).not.toContain('\u001b]');
      expect(text, format).not.toContain('\u0007');
    }
    expect(renderRun(result(body), 'text')).toContain(
      'answer: oops<U+001B>]0;owned<U+0007> second line',
    );
  });

  it('keeps the answer as it was in JSON', () => {
    const json = JSON.parse(renderRun(result('a\u001bb'), 'json'));
    expect(json.steps[0].attempts[0].body).toBe('a\u001bb');
    expect(json.schemaVersion).toBe(0);
  });
});

describe('renderDecode', () => {
  const chain = createTestChain();

  it('writes dates out and shortens nested JWS, saying whether each one follows', () => {
    const payload = {
      signedDate: 1790845200000,
      data: { signedTransactionInfo: 'eyJhbGciOi.eyJ0.sig' },
      signedTransactionInfo: 'eyJhbGciOi.eyJ0.sig',
    };
    expect(rows(payload, '', new Set(['data.signedTransactionInfo']))).toEqual([
      ['signedDate', '1790845200000  2026-10-01T09:00:00.000Z'],
      ['data.signedTransactionInfo', 'eyJhbGciOi.eyJ0.… (JWS, below)'],
      ['signedTransactionInfo', 'eyJhbGciOi.eyJ0.… (JWS, not decoded)'],
    ]);
  });

  it('prints payload strings as JSON, so escapes stay text', () => {
    const token = signJws(
      { notificationType: 'TEST\u001b[2J', signedDate: Date.now() },
      chain.signingKey,
      [chain.signing, chain.intermediate, chain.root],
    );
    const text = renderDecode(
      decode(token, { roots: [{ label: 'test', der: chain.root }] }),
      'tty',
      {
        color: true,
      },
    );
    expect(text).not.toContain('\u001b[2J');
    expect(text).toContain('"TEST\\u001b[2J"');
  });
});

describe('renderDecode with a hostile header', () => {
  it('prints the header’s alg cleaned, on one line', () => {
    const chain = createTestChain();
    const header = Buffer.from(
      JSON.stringify({
        alg: 'ES256\u001b[31m\nX',
        x5c: [chain.signing, chain.intermediate, chain.root].map((der) =>
          Buffer.from(der).toString('base64'),
        ),
      }),
    ).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ notificationType: 'TEST', signedDate: Date.now() }),
    ).toString('base64url');
    const token = `${header}.${body}.${Buffer.alloc(64).toString('base64url')}`;
    for (const format of ['tty', 'text'] as const) {
      const text = renderDecode(decode(token), format, { color: true });
      expect(text, format).not.toContain('ES256\u001b');
      expect(text, format).toContain('ES256<U+001B>[31m X');
    }
  });
});

describe('renderDecode with a hostile payload key', () => {
  const key = 'a` | <img src=x onerror=alert(1)> | `b';
  const keys = createTestChain();
  const token = signJws({ notificationType: 'TEST', [key]: 1 }, keys.signingKey, [
    keys.signing,
    keys.intermediate,
    keys.root,
  ]);

  it('keeps the key inside its table cell in Markdown', () => {
    const text = renderDecode(decode(token, { verify: false }), 'markdown');
    const row = text.split('\n').find((line) => line.includes('onerror'));
    expect(row).toBe('| a\\` \\| \\<img src=x onerror=alert(1)\\> \\| \\`b | 1 |');
    // Three unescaped pipes: the two edges and the one between the cells.
    expect(row?.match(/(?<!\\)\|/g)).toHaveLength(3);
    expect(text).not.toMatch(/(?<!\\)<img/);
  });

  it('writes plain names as code spans, and anything with a backtick or pipe escaped', () => {
    expect(markdownCode('data.signedTransactionInfo')).toBe('`data.signedTransactionInfo`');
    expect(markdownCode('http://127.0.0.1:3000/asn')).toBe('`http://127.0.0.1:3000/asn`');
    expect(markdownCode('<b>x</b>')).toBe('`<b>x</b>`');
    expect(markdownCode('a`b')).toBe('a\\`b');
    expect(markdownCode('a|b')).toBe('a\\|b');
    expect(markdownCode('')).toBe('');
  });
});
