import { readFileSync } from 'node:fs';
import { type Answer, redactAnswer } from '../../src/redact/body.js';
import { redactText } from '../../src/redact/text.js';
import { redactUrl } from '../../src/redact/url.js';
import { MAX_BODY } from '../../src/run/deliver.js';

// The shared review corpus of REDACTION-SPEC §8 #65 (test/data/redaction/ReviewProbes.jsonl,
// the S corpus of 7,866 lines) and the way its probes are judged there: a probe leaks when any
// `width` characters of its secret show in some reading of the output (as written, without
// invisible characters, with escapes undone, also without line breaks), or, for a card number,
// when more than its last four digits do.

export type Probe = {
  review: string;
  id: number;
  category: string;
  claim: 'C' | 'D' | 'K' | 'X';
  kind: 'text' | 'body' | 'url';
  type?: string | null;
  input?: string;
  repeat?: { prefix: string; unit: string; count: number; suffix: string };
  data?: string;
  secret: string;
  digits?: boolean;
  width?: number;
};

const CORPUS = new URL('../data/redaction/ReviewProbes.jsonl', import.meta.url);

export const probes: Probe[] = readFileSync(CORPUS, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line) as Probe);

export const probeName = (probe: Probe) => `${probe.review}#${probe.id}`;

export function probeText(probe: Probe): string {
  if (probe.input !== undefined) return probe.input;
  const piece = probe.repeat;
  return piece ? piece.prefix + piece.unit.repeat(piece.count) + piece.suffix : '';
}

/** The probe's body as asnsim keeps a webhook's answer: its first 64 KB and its content type. */
function probeAnswer(probe: Probe): Answer {
  const bytes =
    probe.data === undefined ? Buffer.from(probeText(probe)) : Buffer.from(probe.data, 'base64');
  return {
    bytes: bytes.subarray(0, MAX_BODY),
    contentType: probe.type ?? null,
    cut: bytes.length > MAX_BODY,
  };
}

/**
 * Whether asnsim reads the probe the way the corpus means it. The corpus sends bodies as a form,
 * multipart, XML or another type that is not JSON to test rules asnsim does not have.
 */
export function appliesToAsnsim(probe: Probe): boolean {
  if (probe.kind !== 'body') return true;
  const type = (probe.type ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  return type === '' || type === 'application/json' || type === 'text/json' || /\+json$/.test(type);
}

export function redactProbe(probe: Probe): string {
  if (probe.kind === 'url') return redactUrl(probeText(probe));
  if (probe.kind === 'body') return redactAnswer(probeAnswer(probe));
  return redactText(probeText(probe));
}

// Hangul fillers and the braille blank, which show nothing.
const BLANKS = new Set([0x3164, 0xffa0, 0x115f, 0x1160, 0x2800]);
const HIDDEN =
  /[\p{Default_Ignorable_Code_Point}\p{Variation_Selector}\p{Cf}\p{Mn}\p{Me}\p{Mc}\p{Cn}\p{Co}]/u;

/** The text without invisible characters and marks, in compatibility form. */
export function visible(text: string): string {
  let out = '';
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (HIDDEN.test(char) || BLANKS.has(code)) continue;
    if (/\p{Cc}/u.test(char) && char !== '\n' && char !== '\t') continue;
    out += char;
  }
  return out.normalize('NFKC');
}

const hex = (text: string) => /^[0-9A-Fa-f]+$/.test(text);

/** One pass of undoing `%XX`, `\uXXXX`, `\"`, `\\`, `\/` and `&#…;`. */
function decodedOnce(text: string): string {
  return text
    .replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
      const bytes = run
        .match(/%([0-9A-Fa-f]{2})/g)
        ?.map((byte) => Number.parseInt(byte.slice(1), 16));
      return new TextDecoder().decode(new Uint8Array(bytes ?? []));
    })
    .replace(
      /\\u([0-9A-Fa-f]{4})|\\(["\\/])|&#([xX][0-9A-Fa-f]{1,11}|\d{1,12});?/g,
      (all, u, c, n) => {
        if (u) return String.fromCharCode(Number.parseInt(u, 16));
        if (c) return c;
        const isHex = /^[xX]/.test(n);
        const value = Number.parseInt(isHex ? n.slice(1) : n, isHex ? 16 : 10);
        return (isHex ? hex(n.slice(1)) : true) && value <= 0x10ffff
          ? String.fromCodePoint(value)
          : all;
      },
    );
}

function decodingEscapes(text: string): string {
  let current = text;
  for (let pass = 0; pass < 8; pass++) {
    const decoded = decodedOnce(current);
    if (decoded === current) break;
    current = decoded;
  }
  return current;
}

function readings(output: string): string[] {
  const plus = output.replaceAll('+', ' ');
  const views = [
    output,
    visible(output),
    visible(decodingEscapes(output)),
    visible(decodingEscapes(visible(output))),
    visible(decodingEscapes(plus)),
  ];
  return [...views, ...views.map((view) => view.replace(/[\r\n]/g, ''))];
}

/** The decimal digits of a text, each written as 0–9 whatever its script. */
function digitsOf(text: string): string {
  let out = '';
  for (const char of text) {
    if (/\p{Nd}/u.test(char)) {
      const code = char.codePointAt(0) ?? 0;
      let zero = code;
      while (/\p{Nd}/u.test(String.fromCodePoint(zero - 1))) zero--;
      out += String((code - zero) % 10);
    } else if (/^\d$/.test(char.normalize('NFKC'))) {
      out += char.normalize('NFKC');
    }
  }
  return out;
}

/** The piece of the probe's secret that shows in the output, or undefined. */
export function leakedPiece(probe: Probe, output: string): string | undefined {
  const views = readings(output);
  if (probe.digits) {
    const all = digitsOf(probe.secret);
    const needle = all.slice(0, all.length > 8 ? all.length - 4 : all.length);
    return views.some((view) => digitsOf(view).includes(needle)) ? needle : undefined;
  }
  const characters = [...probe.secret];
  const length = Math.min(probe.width ?? 6, characters.length);
  for (let start = 0; start + length <= characters.length; start++) {
    const piece = characters.slice(start, start + length).join('');
    const folded = visible(piece);
    if (views.some((view) => view.includes(piece) || (folded !== '' && view.includes(folded)))) {
      return piece;
    }
  }
  return undefined;
}
