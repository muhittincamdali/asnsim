import {
  heldNameNamesSecret,
  INVISIBLE_CLASS,
  isOnlyControls,
  isPlainName,
  looksSecret,
  namesSecret,
  REDACTED,
  words,
} from './names.js';
import { redactText } from './text.js';

// A webhook's answer as a report may show it (REDACTION-SPEC §2, §4): JSON is read as JSON, each
// value hidden when its key names a secret or is not a plain name, each string read as free text;
// anything else is free text (§6).

const MAX_DEPTH = 64;
// Fields that hold the name of another field ({"label":"Password","value":"…"}).
const NAME_FIELDS = new Set(['name', 'key', 'field', 'label', 'type', 'header', 'param', 'path']);
const NAME_FIELDS_SHORT = new Set(['id', 'k', 'n']);
// Name fields that stay shown when a neighbour names a secret, and JSON Patch operations.
const KEPT_FIELDS = new Set(['name', 'key', 'field', 'header', 'param', 'path', 'k', 'n']);
const PATCH_OPS = new Set(['add', 'remove', 'replace', 'move', 'copy', 'test']);

class TooDeep extends Error {}

const isNameField = (key: string) =>
  NAME_FIELDS.has(key.toLowerCase()) || NAME_FIELDS_SHORT.has(key.toLowerCase());

// Punctuation, symbols, spaces and invisible characters at either end of a name ("Password:",
// "api_key =", "token\u3164").
const EDGE = `(?:[\\p{P}\\p{S}\\p{Z}]|${INVISIBLE_CLASS})+`;
const NAME_EDGES = new RegExp(`^${EDGE}|${EDGE}$`, 'gu');

/**
 * A string that is only a name (K12): at most 256 characters, a letter or digit (in compatibility
 * form, so "ⓟ" counts), and none of `: = , ; " ' ( ) [ ] { } < >` once the punctuation, spaces and
 * line breaks at either end are left out.
 */
const isName = (text: string) =>
  [...text].length <= 256 &&
  /[\p{L}\p{N}]/u.test(text.normalize('NFKC')) &&
  !/[:=,;"'()[\]{}<>]/.test(text.replace(NAME_EDGES, ''));

/** Whether a string, wherever it is, names a secret as a name would (K10–K12). */
const isSecretName = (text: string) =>
  isOnlyControls(text) || (isName(text) && heldNameNamesSecret(text));

/** Whether a name field's value names a secret: anything but a plain name that names none. */
function heldNameIsSecret(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return true;
  const names = key.toLowerCase() === 'path' ? value.split('/').filter(Boolean) : [value];
  if (names.length === 0) return true;
  return names.some((name) => !isPlainName(name) || heldNameNamesSecret(name));
}

/** Whether a member names a secret: a key that is not a plain name, or a value that names one. */
function namesSecretField(key: string, value: unknown): boolean {
  // A field whose own name is not plain holds a name, as name fields do.
  if (!isPlainName(key) || isNameField(key)) return heldNameIsSecret(key, value);
  return typeof value === 'string' && isSecretName(value);
}

/**
 * The members that name a secret and stay shown as the name they hold. A name field holds the
 * name; any other member that names a secret may be the value of the pair
 * ({"label":"Password","value":"Secret2024!"}), so it stays shown only when no name field names
 * a secret and it is the one member that does ({"OptionName":"pa\nssword","Value":"x"}).
 */
function shownNames(naming: Set<string>): Set<string> {
  const holders = [...naming].filter(isNameField);
  if (holders.length > 0) return new Set(holders);
  return naming.size === 1 ? naming : new Set();
}

function redactObject(object: Record<string, unknown>, depth: number): Record<string, unknown> {
  const entries = Object.entries(object);
  // A member that names a secret hides the values of all the others: {"label":"Password",…}.
  const naming = new Set(
    entries.filter(([key, value]) => namesSecretField(key, value)).map(([key]) => key),
  );
  const names = shownNames(naming);
  // No prototype, so a "__proto__" key stays a member.
  const shown: Record<string, unknown> = Object.create(null);
  let hiddenNames = 0;
  for (const [key, value] of entries) {
    const plain = redactText(key) === key && !looksSecret(key);
    // Hidden names stay apart ("[redacted]", "[redacted 2]"), so no member is lost; a key as
    // written can never read "[redacted 2]", since "[" cuts free text.
    const name = plain ? key : hiddenNames++ === 0 ? REDACTED : `[redacted ${hiddenNames}]`;
    const kept =
      names.has(key) ||
      KEPT_FIELDS.has(key.toLowerCase()) ||
      (key === 'op' && typeof value === 'string' && PATCH_OPS.has(value));
    const hidden = !isPlainName(key) || namesSecret(words(key)) || (naming.size > 0 && !kept);
    shown[name] = hidden ? REDACTED : redactValue(value, depth + 1);
  }
  return shown;
}

function redactArray(array: unknown[], depth: number): unknown[] {
  let afterName = false;
  return array.map((entry, index) => {
    if (afterName) return REDACTED;
    const namesOne = typeof entry === 'string' && isSecretName(entry);
    // ["Authorization","Bearer …"]: a pair whose first element is not a plain name, or names a
    // secret, hides the second; ["password","…"] hides what follows the name.
    if (index === 0 && array.length === 2 && typeof entry === 'string' && !isPlainName(entry)) {
      afterName = true;
    }
    if (namesOne) afterName = true;
    return redactValue(entry, depth + 1);
  });
}

function redactValue(value: unknown, depth: number): unknown {
  // A string of controls alone ("\t") is hidden like the value it names (K11).
  if (typeof value === 'string') return isOnlyControls(value) ? REDACTED : redactText(value);
  if (typeof value === 'number') return looksSecret(String(value)) ? REDACTED : value;
  if (typeof value !== 'object' || value === null) return value;
  // depth counts the arrays and objects around this one.
  if (depth >= MAX_DEPTH) throw new TooDeep();
  if (Array.isArray(value)) return redactArray(value, depth);
  return redactObject(value as Record<string, unknown>, depth);
}

/** A JSON value from the backend, as a report may show it. */
export function redactJson(value: unknown): unknown {
  try {
    return redactValue(value, 0);
  } catch (error) {
    if (error instanceof TooDeep) return REDACTED;
    throw error;
  }
}

/** A response body as a report may show it: JSON as JSON, anything else as free text. */
export function redactBody(body: string): string {
  const trimmed = body.trim();
  if (!/^[[{]/.test(trimmed)) return redactText(body);
  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return redactText(body);
  }
  try {
    return JSON.stringify(redactValue(json, 0));
  } catch (error) {
    if (error instanceof TooDeep) {
      return `[body omitted: ${Buffer.byteLength(body)} bytes, JSON deeper than ${MAX_DEPTH} levels]`;
    }
    throw error;
  }
}
