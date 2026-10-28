import { isPlainName, looksSecret, namesSecret, REDACTED, words } from './names.js';
import { redactUrl } from './url.js';

// Free text as a report may show it (REDACTION-SPEC §6, one cut): the text is read word by word,
// left to right, and at the first word that may hold or name a secret everything from there to
// the end, the following lines included, becomes one [redacted]. asnsim reads more strictly than
// the specification, which it allows: only printable ASCII is read (any other character cuts),
// and quotes, markup, escapes, brackets and `@` cut at the start of their word.

const MAX_TEXT = 1_000_000;
const MAX_WORD = 256;
/** Keys whose value is read on, as in `status=200`; any other key's value is hidden. */
const TEXT_KEYS = new Set(['status', 'method', 'path', 'duration_ms', 'count']);
// Printable ASCII that cuts at the start of its word.
const CUTTING = /["#$%&*;<>@[\\\]^`{|}~]/;
// Numbers that hold a colon: times, dates with times, address:port, line:column.
const NUMBER_WITH_COLON = [
  /^\d{1,2}(:\d{2}){1,2}(\.\d{1,9})?$/,
  /^\d{4}-\d{2}-\d{2}T\d{1,2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}(:?\d{2})?)?$/,
  /^\d{1,3}(\.\d{1,3}){3}:\d{1,5}$/,
  /^\d{1,6}:\d{1,4}$/,
];

/** A word shown (`text`, rewritten for a URL), or cut after its first `keep` characters. */
type Reading = { cut: false; text: string } | { cut: true; keep: number };

const whole = (text: string): Reading => ({ cut: false, text });
const cutAt = (keep: number): Reading => ({ cut: true, keep });

function parenthesesClose(text: string): boolean {
  let depth = 0;
  for (const char of text) {
    if (char === '(') depth++;
    if (char === ')' && --depth < 0) return false;
  }
  return depth === 0;
}

/** A URL word: shown, as redactUrl() writes it, only when it is clean (§6 C3). */
function readUrl(word: string): Reading {
  const trailer = /[.,!)]$/.test(word) ? word.slice(-1) : '';
  const core = trailer ? word.slice(0, -1) : word;
  const match = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/([A-Za-z0-9._/-]+)$/.exec(core);
  if (!match || /[.,!)]$/.test(core)) return cutAt(0);
  const [host = '', ...segments] = (match[1] ?? '').split('/');
  // A segment without letters or digits counts as a name; only the last one may be empty.
  const unnamed = (segment: string, index: number) =>
    segment === '' ? index !== segments.length - 1 : !/[A-Za-z0-9]/.test(segment);
  if (segments.some(unnamed)) return cutAt(0);
  if ([...host.split('.'), ...segments].some((name) => namesSecret(words(name)))) return cutAt(0);
  const shown = redactUrl(core);
  return shown.includes(REDACTED) || shown === '<unparsed URL>' ? cutAt(0) : whole(shown + trailer);
}

function readKey(word: string, at: number, parenthesesOk: boolean): Reading {
  const key = word.slice(0, at);
  const separator = /^[:=>]+/.exec(word.slice(at))?.[0] ?? '';
  const rest = word.slice(at + separator.length);
  if (!isPlainName(key)) return cutAt(0);
  if (!TEXT_KEYS.has(key) || namesSecret(words(key))) return cutAt(at + separator.length);
  const value = readWord(rest, parenthesesOk);
  if (value.cut) return cutAt(at + separator.length + value.keep);
  return whole(`${key}${separator}${value.text}`);
}

function readWord(word: string, parenthesesOk: boolean): Reading {
  if (word === '') return whole('');
  if (word.length > MAX_WORD || /[^\x21-\x7e]/.test(word)) return cutAt(0);
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(word)) return readUrl(word);
  if (CUTTING.test(word) || /^\?|\?./.test(word)) return cutAt(0);
  if (/'/.test(word.replace(/(?<=[A-Za-z])'(?=[A-Za-z])/g, ''))) return cutAt(0);
  if (/[()]/.test(word) && !parenthesesOk) return cutAt(0);
  if (NUMBER_WITH_COLON.some((pattern) => pattern.test(word.replace(/[.,!?]$/, '')))) {
    return whole(word);
  }
  // A long token or JWT, or the start of an IBAN (DE89, or DE89370400440532013000).
  if (looksSecret(word) || /^[A-Z]{2}\d{2}([A-Z0-9]{11,30})?$/.test(word)) return cutAt(0);
  const separator = word.search(/[:=]/);
  if (separator === 0) return cutAt(0);
  return separator > 0 ? readKey(word, separator, parenthesesOk) : whole(word);
}

/**
 * The text so far, then [redacted] for the rest. When the cut comes after a whole word, the spaces
 * after it stay, and a word with nothing after it needs no cut at all.
 */
function cutAfterWord(shown: string, rest: string): string {
  if (rest.trim() === '') return shown + rest;
  return `${shown}${/^[ \t]*/.exec(rest)?.[0] ?? ''}${REDACTED}`;
}

const isDigitGroup = (word: string) => /^[\d-]+$/.test(word) && /\d/.test(word);

/** `text` with everything from its first possible secret on replaced by one [redacted]. */
export function redactText(text: string): string {
  if (text.length > MAX_TEXT) return REDACTED;
  const parenthesesOk = parenthesesClose(text);
  let out = '';
  let last = 0;
  let previous: string[] = [];
  // Digit groups written next to each other are read together, as card numbers are written.
  let digits = { count: 0, start: 0 };
  for (const match of text.matchAll(/[^ \t\r\n]+/g)) {
    const word = match[0];
    const gap = text.slice(last, match.index);
    const sameLine = !/[\r\n]/.test(gap) && gap.length <= 3;
    last = match.index + word.length;
    const before = out + gap;
    if (!sameLine) previous = [];
    if (!isDigitGroup(word)) digits = { count: 0, start: 0 };
    else if (digits.count === 0 || !sameLine) digits = { count: 0, start: before.length };
    digits.count += isDigitGroup(word) ? word.replace(/\D/g, '').length : 0;
    if (digits.count >= 13) return `${before.slice(0, digits.start)}${REDACTED}`;
    const reading = readWord(word, parenthesesOk);
    if (reading.cut) {
      return reading.keep === word.length
        ? cutAfterWord(before + word, text.slice(last))
        : `${before}${word.slice(0, reading.keep)}${REDACTED}`;
    }
    out = before + reading.text;
    // A secret's name, alone or split over two words ("to ken"): the text after it is hidden.
    const parts = words(word);
    const across = previous.length > 0 && parts.length > 0 ? [`${previous.at(-1)}${parts[0]}`] : [];
    if (namesSecret(parts) || namesSecret(across)) return cutAfterWord(out, text.slice(last));
    previous = parts;
  }
  return out + text.slice(last);
}
