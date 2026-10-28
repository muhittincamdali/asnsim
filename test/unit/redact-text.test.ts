import { describe, expect, it } from 'vitest';
import { redactBody, redactJson } from '../../src/redact/body.js';
import { redactText } from '../../src/redact/text.js';

// The free text (§8.5, with the detectors of §8.3) and JSON (§8.1) cases of the shared redaction
// rules (REDACTION-SPEC 2.1-r2) that apply to the answers asnsim reports. `[R]` is `[redacted]`.
// Where asnsim hides more than the rules ask (they allow it), the case says so.

const R = '[redacted]';

describe('free text (§8.5)', () => {
  const cases: [string, string][] = [
    // #49–51
    [
      'GET /api/items status=200 method=GET duration_ms=12',
      'GET /api/items status=200 method=GET duration_ms=12',
    ],
    ['login user=bob status=401 password=hunter2', `login user=${R}`],
    ['Error: connection refused\nretrying in 5 s', `Error: ${R}`],
    // #52–54, URLs in text
    ['see https://x.example/a. Next', 'see https://x.example/a. Next'],
    ['see https://x.example/a). ok', `see ${R}`],
    ['see https://x.example/a.. ok', `see ${R}`],
    ['see "https://x.example/a" ok', `see ${R}`],
    ['GET https://api.example.com/users/12345678 200', 'GET https://api.example.com/users/:id 200'],
    ['GET https://api.example.com/items?page=2 done', `GET ${R}`],
    ['see https://x.example:8080/a ok', `see ${R}`],
    ['see https://pin.example/a ok', `see ${R}`],
    ['https://x.example/to ken hunter2', `https://x.example/to ken ${R}`],
    ['git clone https://bob:hunter2@github.com/x/y.git', `git clone ${R}`],
    // #55 quoted keys (asnsim cuts at the quote's word)
    ['cache miss for "session Qz9Wk7rX": refetching', `cache miss for ${R}`],
    ['x"status": 200', R],
    // #56 secret names
    ['pass word hunter2', `pass ${R}`],
    ['PIN 1234', `PIN ${R}`],
    ['bypass ok', 'bypass ok'],
    ['hdr Bearer abcdefgh12345678 ok', `hdr Bearer ${R}`],
    // #57–59 markup and escapes (asnsim also cuts "a < b")
    ['<_id>7</_id>', R],
    ['pattern ^\\d+$ matched', `pattern ${R}`],
    ['copied to \\\\nas\\backup', `copied to ${R}`],
    ['user&colon;hunter2', R],
    ['R&D team', R],
    // #60 numbers with a colon
    ['user1:2345678 at 12:30', `user1:${R}`],
    ['at 12:30 id 7:9hunter2', `at 12:30 id 7:${R}`],
    ['t 1:482913', `t 1:${R}`],
    ['at 10.0.0.1:8080 ok', 'at 10.0.0.1:8080 ok'],
    ['at 2026-10-19T12:30:45.123+03:00 ok', 'at 2026-10-19T12:30:45.123+03:00 ok'],
    ['line 42:10', 'line 42:10'],
    // #61 outside printable ASCII
    ['Merhaba dünya 👋 bye', `Merhaba ${R}`],
    ['a b', R],
    ['status=200\u000bok', R],
    // #62 brackets
    ['say (hello', `say ${R}`],
    ['say (hello) ok', 'say (hello) ok'],
    // §8.3 detectors
    ['paid 4111 1111 1111 1111 ok', `paid ${R}`],
    ['ok 4111-1111-1111-1111 ok', `ok ${R}`],
    ['ref DE89 3704 0044 0532 0130 00 ok', `ref ${R}`],
    ['mail alice@example.com ok', `mail ${R}`],
    ['tok eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig ok', `tok ${R}`],
    ['hex 0123456789abcdef0123456789abcdef ok', `hex ${R}`],
    [
      'uuid 123e4567-e89b-12d3-a456-426614174000 ok',
      'uuid 123e4567-e89b-12d3-a456-426614174000 ok',
    ],
  ];
  for (const [text, shown] of cases) {
    it(JSON.stringify(text), () => expect(redactText(text)).toBe(shown));
  }

  it('hides the following lines too, and keeps text without a secret as it is', () => {
    expect(redactText('ok\ntoken: abc\nmore')).toBe(`ok\ntoken: ${R}`);
    expect(redactText('Unauthorized\n')).toBe('Unauthorized\n');
    expect(redactText('')).toBe('');
  });
});

describe('JSON answers (§8.1)', () => {
  it('#1, #7 hides values by key and reads strings as free text', () => {
    expect(redactBody('{"user":"bob","password":"hunter2"}')).toBe(
      `{"user":"bob","password":"${R}"}`,
    );
    expect(redactBody('{"note":"password=hunter2","ok":"fine"}')).toBe(
      `{"note":"password=${R}","ok":"fine"}`,
    );
  });

  it('#6 hides a whole value, object or array', () => {
    expect(redactBody('{"password":{"a":[1,2]},"x":1}')).toBe(`{"password":"${R}","x":1}`);
  });

  it('#10, #16 hides what a held name names', () => {
    expect(redactBody('[["Authorization","Bearer abc"],["Accept","x"]]')).toBe(
      `[["Authorization","${R}"],["Accept","x"]]`,
    );
    expect(redactBody('{"label":"Password","value":"hunter2","x":1}')).toBe(
      `{"label":"Password","value":"${R}","x":"${R}"}`,
    );
  });

  it('#4 hides the value, and the name, of a key that is not a plain name', () => {
    // Each hidden name is numbered, so the report keeps every member.
    expect(redactBody('{"pаssword":"x","şifre":"y","user[id]":"z","ok":"1"}')).toBe(
      `{"${R}":"${R}","[redacted 2]":"${R}","[redacted 3]":"${R}","ok":"1"}`,
    );
    expect(redactBody('{"__proto__":"a","ok":"1"}')).toBe('{"__proto__":"a","ok":"1"}');
  });

  it('#13 leaves out JSON deeper than 64 levels', () => {
    const deep = `${'['.repeat(65)}${']'.repeat(65)}`;
    expect(redactBody(deep)).toBe('[body omitted: 130 bytes, JSON deeper than 64 levels]');
    expect(redactJson(JSON.parse(deep))).toBe(R);
  });

  it('reads anything that is not JSON as free text', () => {
    expect(redactBody('denied: token SECRET-TOKEN-123')).toBe(`denied: ${R}`);
    expect(redactBody('{"a":')).toBe(R);
    expect(redactBody('{"active":true}')).toBe('{"active":true}');
  });
});

describe('held names and control characters (§8.2, K10–K12)', () => {
  // The member that names a secret is itself read as free text, so it may be cut too.
  const R_ = `"${R}"`;
  const cases: [string, string, string][] = [
    ['#20', '{"name":"Hello\\nWorld","value":"x"}', `{"name":"Hello\\nWorld","value":${R_}}`],
    ['#21', '{"note":"pass\\nword","id":"7"}', `{"note":"pass${R}","id":${R_}}`],
    ['#22', '{"title":"\\n","data":"x"}', `{"title":${R_},"data":${R_}}`],
    [
      '#22',
      '{"ParameterKey":"\\t","ParameterValue":"x"}',
      `{"ParameterKey":${R_},"ParameterValue":${R_}}`,
    ],
    ['#22', '{"title":" \\u0000 ","data":"x"}', `{"title":${R_},"data":${R_}}`],
    ['#23', '{"message":"Hello\\nWorld","id":"7"}', '{"message":"Hello\\nWorld","id":"7"}'],
    [
      '#24',
      '{"ParameterKey":"DbPassword\\n","ParameterValue":"x"}',
      `{"ParameterKey":${R_},"ParameterValue":${R_}}`,
    ],
    [
      '#24',
      '{"OptionName":"pa\\nssword","Value":"x"}',
      `{"OptionName":"pa\\nssword","Value":${R_}}`,
    ],
    ['K11', '{"note":"pa\\nss","v":"x"}', `{"note":"pa\\nss","v":${R_}}`],
    // K12: punctuation at either end of a name does not stop it naming a secret (SF-ASN-7).
    [
      'K12',
      '{"Option":"DbPassword:","Value":"hunter2-c"}',
      `{"Option":"DbPassword:","Value":${R_}}`,
    ],
    ['K12', '{"label":"api_key =","value":"x"}', `{"label":"api_key ${R}","value":${R_}}`],
    ['K12', '{"title":"(Password)","v":"x"}', `{"title":"(Password)","v":${R_}}`],
    ['K12', '["db","password:","hunter2-b"]', `["db","password:",${R_}]`],
    ['K12', '["password:","hunter2"]', `["password:",${R_}]`],
    ['K12', '["\\n","hunter2"]', `[${R_},${R_}]`],
    ['K12', '{"title":"ⓟⓘⓝ","v":"1234"}', `{"title":"${R}","v":${R_}}`],
    // A sentence is free text, not a name.
    ['K12', '{"note":"pass: ok, done","id":"7"}', `{"note":"pass: ${R}","id":"7"}`],
    // K10: a value that names a secret too is still the value of the pair, not a second name.
    ['K10', '{"label":"Password","value":"Secret2024!"}', `{"label":"Password","value":${R_}}`],
    ['K10', '{"value":"Secret2024!","label":"Password"}', `{"value":${R_},"label":"Password"}`],
    ['K10', '{"name":"api_key","value":"livekey"}', `{"name":"api_key","value":${R_}}`],
    ['K10', '{"Name":"token","Value":"tokenABC"}', `{"Name":"token","Value":${R_}}`],
    ['K10', '{"field":"pin","value":"pin"}', `{"field":"pin","value":${R_}}`],
    [
      'K10',
      '{"ParameterKey":"DbPassword","ParameterValue":"supersecret"}',
      `{"ParameterKey":${R_},"ParameterValue":${R_}}`,
    ],
    [
      'K10',
      '{"OptionName":"DbPassword","Value":"MyPassword1"}',
      `{"OptionName":${R_},"Value":${R_}}`,
    ],
  ];
  for (const [rule, body, shown] of cases) {
    it(`${rule} ${body}`, () => expect(redactBody(body)).toBe(shown));
  }

  it('keeps every value a webhook answered with 500 hidden (SF-ASN-7)', () => {
    const body = JSON.stringify({
      ParameterKey: '\t',
      ParameterValue: 'hunter2-a',
      errors: ['db', 'password:', 'hunter2-b'],
      Option: 'DbPassword:',
      Value: 'hunter2-c',
    });
    expect(redactBody(body)).not.toMatch(/hunter2/);
  });

  it('hides a value that names a secret next to the name it belongs to (K10)', () => {
    const body = JSON.stringify({
      errors: [
        { label: 'Password', value: 'Secret2024!' },
        { name: 'api_key', value: 'livekey' },
        { ParameterKey: 'DbPassword', ParameterValue: 'supersecret' },
      ],
    });
    expect(redactBody(body)).not.toMatch(/Secret2024|livekey|supersecret/);
  });
});

describe('names with format characters (SF-ASN-9)', () => {
  // A zero-width space, soft hyphen, BOM or word joiner shows nothing on screen.
  const names = ['pass​word', 'api­key', 'to﻿ken', 'secret⁠', 's​id'];
  const shapes: [string, (name: string) => unknown][] = [
    ['key', (name) => ({ [name]: 'hunter2', ok: '1' })],
    ['label', (name) => ({ label: name, value: 'hunter2' })],
    ['title', (name) => ({ title: name, data: 'hunter2' })],
    ['ParameterKey', (name) => ({ ParameterKey: name, ParameterValue: 'hunter2' })],
    ['OptionName', (name) => ({ OptionName: name, Value: 'hunter2' })],
    ['pair', (name) => [name, 'hunter2']],
  ];
  for (const name of names) {
    for (const [shape, body] of shapes) {
      it(`hides the value next to ${JSON.stringify(name)} as ${shape}`, () =>
        expect(redactBody(JSON.stringify(body(name)))).not.toMatch(/hunter2/));
    }
  }

  it('reads a name of format characters alone as controls alone (K11)', () => {
    expect(redactBody('{"ParameterKey":"\\uFEFF\\u200B","ParameterValue":"x"}')).toBe(
      `{"ParameterKey":"${R}","ParameterValue":"${R}"}`,
    );
    expect(redactBody('{"title":"\\u200B","data":"x"}')).toBe(`{"title":"${R}","data":"${R}"}`);
    expect(redactBody('{"title":" \\u2060 ","data":"x"}')).toBe(`{"title":"${R}","data":"${R}"}`);
    expect(redactBody('["\\u00AD","x"]')).toBe(`["${R}","${R}"]`);
  });

  it('keeps a value next to a name that names no secret', () => {
    expect(redactBody('{"title":"sta\\u200Btus","data":"x"}')).toBe(`{"title":"${R}","data":"x"}`);
  });
});

describe('names split by characters that show nothing (SF-ASN-10)', () => {
  // Each shows nothing or only marks the letter before it: a zero-width space, the Hangul filler
  // U+3164, the braille blank, a combining acute accent, the Hangul choseong filler, the
  // halfwidth Hangul filler, the combining grapheme joiner, a variation selector and a tag space.
  const splitters = {
    zwsp: '​',
    hangul: 'ㅤ',
    braille: '⠀',
    mark: '́',
    choseong: 'ᅟ',
    halfwidth: 'ﾠ',
    cgj: '͏',
    vs16: '️',
    tag: '\u{E0020}',
  };
  const halves = [
    ['pa', 'ss'],
    ['s', 'id'],
    ['p', 'w'],
    ['pass', 'word'],
    ['to', 'ken'],
  ];
  const shapes: [string, (name: string) => string][] = [
    ['pair', (name) => JSON.stringify([name, 'hunter2'])],
    ['label', (name) => JSON.stringify({ label: name, value: 'hunter2' })],
    ['OptionName', (name) => JSON.stringify({ OptionName: name, OptionValue: 'hunter2' })],
    [
      'ParameterKey',
      (name) =>
        JSON.stringify({ ParameterKey: `DB_${name.toUpperCase()}`, ParameterValue: 'hunter2' }),
    ],
  ];
  for (const [label, splitter] of Object.entries(splitters)) {
    for (const [first, second] of halves) {
      const name = `${first}${splitter}${second}`;
      for (const [shape, body] of shapes) {
        it(`hides the value next to ${first}|${second} split by ${label} as ${shape}`, () =>
          expect(redactBody(body(name))).not.toMatch(/hunter2/));
      }
      it(`hides the text after ${first}|${second} split by ${label}`, () => {
        expect(redactText(`DB_${name}=hunter2`)).not.toMatch(/hunter2/);
        expect(redactText(`error ${name}: hunter2`)).not.toMatch(/hunter2/);
      });
    }
  }

  // Every reading is also tried with its letters and digits joined, so the two halves of a name
  // cannot be kept apart by a mix of characters, nor by a visible separator in a held name.
  const joined = ['pa​ss\u0007word', 'pa-ss', 'p_w', 's.id', 'tóken', 'paㅤss​word'];
  for (const name of joined) {
    it(`reads ${JSON.stringify(name)} with its letters joined`, () => {
      expect(redactBody(JSON.stringify({ OptionName: name, OptionValue: 'hunter2' }))).not.toMatch(
        /hunter2/,
      );
      expect(redactBody(JSON.stringify([name, 'hunter2']))).not.toMatch(/hunter2/);
    });
  }

  it('reads a name of these characters alone as controls alone (K11)', () => {
    expect(redactBody('{"title":"\\u3164","data":"x"}')).toBe(`{"title":"${R}","data":"${R}"}`);
    expect(redactBody('["\\u2800","x"]')).toBe(`["${R}","${R}"]`);
  });

  it('keeps a value next to a name that names no secret', () => {
    expect(redactBody('{"OptionName":"sta\\u3164tus","OptionValue":"x"}')).toBe(
      `{"OptionName":"${R}","OptionValue":"x"}`,
    );
  });
});

describe('detectors (§8.3)', () => {
  // asnsim hides every finding whole, so the masks of the reference package (•••• 1111) are [R].
  const cases: [string, string, string][] = [
    ['#25', 'paid 4111 1111 1111 1111 ok', `paid ${R}`],
    ['#25', 'ok 4111-1111-1111-1111 ok', `ok ${R}`],
    ['#26', '٤٢٤٢ ٤٢٤٢ ٤٢٤٢ ٤٢٤٢', R],
    ['#27', 'ref DE89 3704 0044 0532 0130 00 ok', `ref ${R}`],
    // More than the rules: 13 or more digits are hidden whatever their letters.
    ['#27', 'de89370400440532013000 lowercase', R],
    ['#28', 'mail alice@example.com ok', `mail ${R}`],
    ['#29', 'contact alice%40example.com', `contact ${R}`],
    ['#30', 'tok eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.dozjgNryP4J3jVmNHl0w5N ok', `tok ${R}`],
    ['#31', 'hdr Bearer abcdefgh12345678 ok', `hdr Bearer ${R}`],
    ['#31', 'hdr bearer abcdefgh12345678 ok', `hdr bearer ${R}`],
    ['#32', 'hex 0123456789abcdef0123456789abcdef ok', `hex ${R}`],
    [
      '#32',
      'uuid 123e4567-e89b-12d3-a456-426614174000 ok',
      'uuid 123e4567-e89b-12d3-a456-426614174000 ok',
    ],
    ['#33', 'git clone https://bob:hunter2@github.com/x/y.git', `git clone ${R}`],
    ['#33', 'redis://:hunter2@host', R],
    ['#35', 'paid with 4111 1111 1111\u20281111', `paid with ${R}`],
    ['#35', 'paid with 4111 1111 1111\u000b1111', `paid with ${R}`],
    ['#35', 'paid 4111\f1111\u00851111\u20291111', `paid ${R}`],
    ['#35', 'mail ali\u2028ce@example.com ok', `mail ${R}`],
    // More than the rules, which let a line break end a card number: asnsim reads groups across
    // line breaks too (SF-ASN-6), as a wrapped log line would split them.
    ['#36', '4111 1111 1111\n1111', R],
    ['SF-ASN-6', '4111 1111\n1111 1111', R],
    ['SF-ASN-6', 'paid 4111 1111\r\n\r\n1111 1111', `paid ${R}`],
    ['SF-ASN-6', '4111 1111. 1111 1111', R],
    ['SF-ASN-6', '4111.1111.1111.1111', R],
    ['SF-ASN-6', '4111/1111/1111/1111', R],
    ['SF-ASN-6', 'card no 4111 / 1111 / 1111 / 1111', `card ${R}`],
    ['SF-ASN-6', 'no 4111 - 1111 - 1111 - 1111 ok', `no ${R}`],
    ['SF-ASN-6', 'no 4111, 1111, 1111, 1111', `no ${R}`],
    // Short numbers and times stay.
    ['D1', 'at 12:30 and 13:45, 10 of 12 items ok', 'at 12:30 and 13:45, 10 of 12 items ok'],
    // Groups further apart than eight white space characters are two numbers.
    [
      'D1',
      `id 4111 1111${'\n'.repeat(9)}1111 1111 ok`,
      `id 4111 1111${'\n'.repeat(9)}1111 1111 ok`,
    ],
  ];
  for (const [rule, text, shown] of cases) {
    it(`${rule} ${JSON.stringify(text)}`, () => expect(redactText(text)).toBe(shown));
  }

  it('#34 hides names that hold a finding', () => {
    expect(redactBody('{"4111111111111111":1,"alice@example.com":2}')).toBe(
      // A key that is not a plain name holds a name, so the other value is hidden too.
      `{"${R}":"${R}","[redacted 2]":"${R}"}`,
    );
  });
});

describe('the free text leaks of the shared review corpus (§8 #65)', () => {
  const text: [string, string][] = [
    // A secret's name glued to its value is cut right after the name.
    ['password/Vq091Lm8x', `password${R}`],
    ['password.Vq107Lm8x', `password${R}`],
    ['password,Vq412Lm8x', `password${R}`],
    ['password(Vq416Lm8x)', `password${R}`],
    ['token-Qx166Np7v', `token${R}`],
    ['token_Qx165Np7v', `token${R}`],
    ["token'Qx161Np7v", `token${R}`],
    ['sid.Qz427Wk7r', `sid${R}`],
    ['pin-Qz428Wk7r', `pin${R}`],
    ['p_w Qx495Np7v', `p_w ${R}`],
    ['to ken/Qx1Np7v', `to ken${R}`],
    // ... also in a path, the value of an allowed key included.
    ['path=/v1/pin/Vq125Lm8x', `path=/v1/pin${R}`],
    ['GET /reset/password/Qn610Rt7w 200', `GET /reset/password${R}`],
    ['GET /api/v1/token/Qz340Wk7r/info 200', `GET /api/v1/token${R}`],
    ['status=200 path=/v1/api-keys/Qx429Np7v', `status=200 path=/v1/api-keys${R}`],
    // A name with nothing after it in its word is kept whole, as before.
    ['enter password, then hunter2', `enter password, ${R}`],
    // An allowed key holds one plain value.
    ['count=12:30 Qx31Sec', `count=${R}`],
    ['status=200 count=3', 'status=200 count=3'],
    // A card number that starts as the value of a key.
    ['status=4111 1111 1111 1111', `status=${R}`],
    ['count=4242 4242 4242 4242', `count=${R}`],
    // A URL that ends in punctuation and a line break may go on, wrapped.
    ['see https://x.example/a/b.\nQx283Np7v', `see ${R}`],
    ['see https://x.example/a. Next', 'see https://x.example/a. Next'],
    // What follows an OpenSSH key type is a key.
    ['ssh-rsa AAAAB3NzaC1yc2E Jx384Pb8n bob@host', `ssh-rsa ${R}`],
  ];
  for (const [input, expected] of text) {
    it(`reads ${JSON.stringify(input)}`, () => expect(redactText(input)).toBe(expected));
  }
});
