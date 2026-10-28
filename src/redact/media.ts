// The Content-Type of a webhook's answer, read as strictly as the shared redaction rules ask
// (REDACTION-SPEC §4 B0): one `type/subtype` and `; name=value` parameters. A second type after a
// comma, a space around `=`, a control character or anything else makes the header unreadable,
// since servers and clients that read it more loosely could take the body for another type.

const TOKEN = "[!#$%&'*+.^_`|~0-9A-Za-z-]+";
const QUOTED = '"(?:[\\t \\x21\\x23-\\x5B\\x5D-\\x7E]|\\\\[\\t \\x21-\\x7E])*"';
const PARAMETER = `[ \\t]*;[ \\t]*(${TOKEN})=(${TOKEN}|${QUOTED})`;
const MEDIA_TYPE = new RegExp(`^(${TOKEN})/(${TOKEN})((?:${PARAMETER})*)$`);
const PARAMETERS = new RegExp(PARAMETER, 'g');
const UTF8_CHARSETS = new Set(['utf-8', 'us-ascii']);

export interface MediaType {
  /** `type/subtype` in lower case. */
  type: string;
  /** Whether the parameters leave the body UTF-8: no charset, or one charset of UTF-8 or US-ASCII. */
  utf8: boolean;
}

/** The media type of a Content-Type header, or undefined when it is not read strictly. */
export function mediaType(header: string): MediaType | undefined {
  const match = MEDIA_TYPE.exec(header.replace(/^[ \t]+|[ \t]+$/g, ''));
  if (!match) return undefined;
  const charsets = [...(match[3] ?? '').matchAll(PARAMETERS)]
    .filter(([, name]) => name?.toLowerCase() === 'charset')
    .map(([, , value = '']) => value.replace(/^"|"$/g, '').toLowerCase());
  const utf8 =
    charsets.length === 0 || (charsets.length === 1 && UTF8_CHARSETS.has(charsets[0] ?? ''));
  return { type: `${match[1]}/${match[2]}`.toLowerCase(), utf8 };
}

/** Whether a media type is JSON: application/json, text/json or any `+json` type. */
export const isJsonType = (type: string) =>
  type === 'application/json' || type === 'text/json' || type.endsWith('+json');
