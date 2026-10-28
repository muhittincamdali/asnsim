// What the report hides, shared by the URL, free text and JSON rules: the names of secrets and the
// values that look like one whatever their name. The rules follow the redaction rules the
// author's packages share (REDACTION-SPEC 2.1-r2); where asnsim differs, it hides more, which
// those rules allow.

/** What stands in for a hidden value. */
export const REDACTED = '[redacted]';

// A secret name found anywhere in a name's letters ("dbpassword"). token, secret and session are
// here too, so "tokenValue" and "session_start" are hidden as well: more than the minimum.
const ANYWHERE = [
  'authorization',
  'clientsecret',
  'refreshtoken',
  'accesstoken',
  'accesskey',
  'authkey',
  'privatekey',
  'secretkey',
  'sessionid',
  'sessionkey',
  'sessid',
  'passphrase',
  'password',
  'passcode',
  'passwd',
  'idtoken',
  'apikey',
  'credential',
  'signature',
  'cookie',
  'pincode',
  'otpcode',
  'securitycode',
  'verificationcode',
  'authcode',
  'cardnumber',
  'token',
  'secret',
  'session',
  'bearer',
];
// A whole word of the name, or its end ("user_pin", "apikey", "X-Auth-Key").
const WORD_OR_END = ['pwd', 'key', 'pin', 'otp', 'cvv', 'cvc', 'ssn', 'iban', 'card', 'auth'];
// Only a whole word ("DB_PASS", but not "bypass").
const WORD = ['pass', 'sid', 'pw'];

/**
 * A name as lowercase words: split at anything but ASCII letters and digits, at camelCase humps,
 * after an acronym ("AWSSecret") and between letters and digits.
 */
export function words(name: string): string[] {
  return name
    .replace(/([a-z])(?=[A-Z])/g, '$1 ')
    .replace(/([A-Z])(?=[A-Z][a-z])/g, '$1 ')
    .replace(/([A-Za-z])(?=\d)/g, '$1 ')
    .replace(/(\d)(?=[A-Za-z])/g, '$1 ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}

const isWord = (word: string, name: string) => word === name || word === `${name}s`;

/** Whether the words (from words()) name a secret; a plural "s" counts. */
export function namesSecret(parts: string[]): boolean {
  const joined = parts.join('');
  if (ANYWHERE.some((name) => joined.includes(name))) return true;
  if (
    WORD_OR_END.some(
      (name) =>
        joined.endsWith(name) ||
        joined.endsWith(`${name}s`) ||
        parts.some((word) => isWord(word, name)),
    )
  ) {
    return true;
  }
  return WORD.some((name) => parts.some((word) => isWord(word, name)));
}

// Control (Cc) and format (Cf) characters: a zero-width space, soft hyphen, word joiner or BOM
// shows nothing, so "pass\u200Bword" reads as "password" on screen.
const INVISIBLE = /[\p{Cc}\p{Cf}]/gu;

/**
 * Whether a name held as a value names a secret (K10, K11): read as written, with its control and
 * format characters left out ("pa\nss", "s\u200Bid"), and in its compatibility form ("ⓟⓘⓝ"),
 * again without them. words() already reads such a character as a space ("Db\nPassword").
 */
export function heldNameNamesSecret(name: string): boolean {
  const compatible = name.normalize('NFKC');
  return [name, name.replace(INVISIBLE, ''), compatible, compatible.replace(INVISIBLE, '')].some(
    (reading) => namesSecret(words(reading)),
  );
}

/**
 * A short string of control and format characters and spaces only, with at least one control or
 * format character (K11): "\t", "\uFEFF\u200B".
 */
export const isOnlyControls = (text: string) =>
  [...text].length <= 256 && /^[\p{Cc}\p{Cf}\s]+$/u.test(text) && /[\p{Cc}\p{Cf}]/u.test(text);

/** A plain ASCII name (K1): letters, digits, `_ - .` and spaces, at least one letter or digit. */
export const isPlainName = (name: string) =>
  name.length <= 256 && /^[A-Za-z0-9_ .-]+$/.test(name) && /[A-Za-z0-9]/.test(name);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether text holds a value that is hidden whatever its name: 13 or more digits (a card number,
 * grouped or not), a JWT, a token of 16 or more letters and digits, or 32 or more base64
 * characters. A UUID on its own is not a secret.
 */
export function looksSecret(text: string): boolean {
  if (UUID.test(text)) return false;
  if ((text.match(/\d/g)?.length ?? 0) >= 13) return true;
  if (/eyJ/.test(text)) return true;
  for (const run of text.match(/[A-Za-z0-9_-]{16,}/g) ?? []) {
    if (/[A-Za-z]/.test(run) && /\d/.test(run)) return true;
  }
  return /[A-Za-z0-9+/=_-]{32,}/.test(text);
}
