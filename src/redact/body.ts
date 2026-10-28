import { isPlainName, looksSecret, namesSecret, REDACTED, words } from './names.js';
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

/** A string that is only a name (K12): no `: = , ; " ' ( ) [ ] { } < >`, a letter or digit. */
const isName = (text: string) =>
  text.length <= 256 && /[A-Za-z0-9]/.test(text) && !/[:=,;"'()[\]{}<>]/.test(text.trim());

/** Whether a name field's value names a secret: anything but a plain name that names none. */
function heldNameIsSecret(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return true;
  const names = key.toLowerCase() === 'path' ? value.split('/').filter(Boolean) : [value];
  if (names.length === 0) return true;
  return names.some((name) => !isPlainName(name) || namesSecret(words(name)));
}

/** Whether a member names a secret: a key that is not a plain name, or a value that names one. */
function namesSecretField(key: string, value: unknown): boolean {
  // A field whose own name is not plain holds a name, as name fields do.
  if (!isPlainName(key) || isNameField(key)) return heldNameIsSecret(key, value);
  return typeof value === 'string' && isName(value) && namesSecret(words(value));
}

function redactObject(object: Record<string, unknown>, depth: number): Record<string, unknown> {
  const entries = Object.entries(object);
  // A member that names a secret hides the values of all the others: {"label":"Password",…}.
  const naming = new Set(
    entries.filter(([key, value]) => namesSecretField(key, value)).map(([key]) => key),
  );
  const shown: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    const name = redactText(key) === key && !looksSecret(key) ? key : REDACTED;
    const kept =
      naming.has(key) ||
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
    const isSecretName = typeof entry === 'string' && isName(entry) && namesSecret(words(entry));
    // ["Authorization","Bearer …"]: a pair whose first element is not a plain name, or names a
    // secret, hides the second; ["password","…"] hides what follows the name.
    if (index === 0 && array.length === 2 && typeof entry === 'string' && !isPlainName(entry)) {
      afterName = true;
    }
    if (isSecretName) afterName = true;
    return redactValue(entry, depth + 1);
  });
}

function redactValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return redactText(value);
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
