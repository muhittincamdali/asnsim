import { describe, expect, it } from 'vitest';
import { namesSecret, words } from '../../src/redact/names.js';
import { redactLocation, redactUrl } from '../../src/redact/url.js';

// The URL cases of the shared redaction rules (REDACTION-SPEC 2.1-r2 §8.4) as asnsim writes URLs
// in its reports. `[R]` is `[redacted]`. Where asnsim hides more than the rules ask (they allow
// it), the case says so.

const R = '[redacted]';

describe('URLs (§8.4)', () => {
  it('#38 drops the user name, password and fragment, hides IDs and query values', () => {
    expect(redactUrl('https://bob:pw@example.com/users/12345678/reset?code=x#y')).toBe(
      `https://example.com/users/:id/reset?code=${R}`,
    );
  });

  it('#39 writes :id after a segment that names a secret', () => {
    expect(redactUrl('https://example.com/v1/cards/4242/pin/4831')).toBe(
      'https://example.com/v1/cards/:id/pin/:id',
    );
  });

  it('#40 cuts a path a server could read differently to scheme and host', () => {
    for (const path of [
      '/pin/./4831',
      '/token/x/../4831',
      '/a;pin/4831',
      '/a%2Fb/c',
      '/a%25/x',
      '/a%5Cb/x',
      '/a%3Bb/x',
      '/a\\..\\pin/4831',
    ]) {
      expect(redactUrl(`https://example.com${path}`), path).toBe('https://example.com');
    }
  });

  it('#41 cuts a path of more than 64 segments', () => {
    expect(redactUrl(`https://example.com${'/a'.repeat(65)}`)).toBe('https://example.com');
  });

  it('#42–43 writes the scheme alone for a host that holds or names a secret', () => {
    expect(redactUrl('https://h.example;password=hunter2/db')).toBe(`https://${R}`);
    expect(redactUrl('https://4111111111111111.example.com/a')).toBe(`https://${R}`);
    expect(redactUrl('myapp://pin/4831')).toBe(`myapp://${R}`);
    expect(redactUrl('myapp://user@pin/Qz743Wk5m')).toBe(`myapp://${R}`);
  });

  it('#44 writes :id for segments that are not plain names (more than the rules: both)', () => {
    expect(redactUrl('https://example.com/caf%C3%A9/menu')).toBe('https://example.com/:id/:id');
    expect(redactUrl('https://example.com/p%0Ain/4831')).toBe('https://example.com/:id/:id');
  });

  it('#45 leaves a masked path as it is', () => {
    expect(redactUrl('https://example.com/users/:id/x')).toBe('https://example.com/users/:id/x');
  });

  it('#46 hides every query value, and a query with ; whole', () => {
    expect(redactUrl('https://example.com/a?page=2&flag')).toBe(
      `https://example.com/a?page=${R}&${R}`,
    );
    expect(redactUrl('https://example.com/a?a=1;b=2')).toBe(`https://example.com/a?${R}`);
  });

  it('#47 does not write a URL it cannot read', () => {
    expect(redactUrl('mailto:ada@example.com')).toBe('<unparsed URL>');
    expect(redactUrl('not a url')).toBe('<unparsed URL>');
  });

  it('keeps a webhook URL readable and hides what it carries', () => {
    expect(redactUrl('http://localhost:3000/notifications')).toBe(
      'http://localhost:3000/notifications',
    );
    expect(redactUrl('http://alice:hunter2@127.0.0.1:3000/asn?token=SEKRET')).toBe(
      `http://127.0.0.1:3000/asn?token=${R}`,
    );
    expect(redactUrl('https://hooks.example.com/asn/3f9a1c0b7d2e4f6a8b9c')).toBe(
      'https://hooks.example.com/asn/:id',
    );
  });

  it('reads a redirect’s Location header against the webhook', () => {
    const webhook = 'http://127.0.0.1:3000/asn';
    expect(redactLocation('/login?next=/asn&token=abc', webhook)).toBe(
      `http://127.0.0.1:3000/login?next=${R}&token=${R}`,
    );
    expect(redactLocation('https://bob:pw@example.com/x#y', webhook)).toBe('https://example.com/x');
    expect(redactLocation('//evil.example/x', webhook)).toBe('<unparsed URL>');
  });
});

describe('secret names', () => {
  it('finds names in keys of every shape', () => {
    for (const name of ['password', 'DB_PASS', 'user_pin', 'X-Auth-Key', 'apiKeys', 'AWSSecret']) {
      expect(namesSecret(words(name)), name).toBe(true);
    }
    for (const name of ['status', 'bypass', 'productId', 'environment', 'active']) {
      expect(namesSecret(words(name)), name).toBe(false);
    }
  });
});
