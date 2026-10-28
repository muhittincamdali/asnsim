import { isPlainName, looksSecret, namesSecret, REDACTED, words } from './names.js';

// A URL as the report writes it (REDACTION-SPEC §5): never the user name, password or fragment;
// query values hidden; path segments that hold IDs or follow a secret's name written `:id`. A URL
// a server could read differently from asnsim (dot segments, escaped `/` `\` `;` `%`, `;` in the
// path) is cut to scheme, host and port, and one whose host names a secret to the scheme alone.

const MAX_SEGMENTS = 64;
const MAX_PARAMETERS = 128;
// Segments made of these characters, once decoded, are shown; anything else becomes `:id`.
const SHOWN_SEGMENT = /^[A-Za-z0-9_.~ +-]*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hostIsShown(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  if (/^\[[0-9a-f:.]+\]$/i.test(host)) return true;
  if (host.length > 253) return false;
  const labels = host.split('.');
  return labels.every(
    (label) =>
      /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(label) &&
      !looksSecret(label) &&
      !namesSecret(words(label)),
  );
}

/** The path as written, before the URL parser resolves dot segments and backslashes. */
function writtenPath(raw: string): string | undefined {
  const beforeQuery = raw.split(/[?#]/, 1)[0] ?? '';
  if (beforeQuery.includes('\\')) return undefined;
  let rest = beforeQuery.replace(/^[A-Za-z][A-Za-z0-9+.-]*:/, '');
  if (rest.startsWith('//')) {
    const end = rest.indexOf('/', 2);
    rest = end < 0 ? '' : rest.slice(end);
  }
  return rest;
}

const readsDifferently = (path: string) =>
  /(^|\/)(\.|\.\.)(\/|$)/.test(path) || /;|%(2e|2f|5c|3b|25)/i.test(path);

function decoded(text: string): string | undefined {
  try {
    return decodeURIComponent(text);
  } catch {
    return undefined;
  }
}

const isValue = (segment: string) =>
  UUID.test(segment) ||
  /^\d{6,}$/.test(segment) ||
  looksSecret(segment) ||
  !SHOWN_SEGMENT.test(segment);

const isLabel = (segment: string) =>
  segment !== '' && (!isPlainName(segment) || namesSecret(words(segment)));

function redactPath(segments: string[]): string {
  let afterLabel = false;
  const shown = segments.map((segment) => {
    if (segment === ':id') {
      afterLabel = false;
      return segment;
    }
    const text = decoded(segment);
    const value = afterLabel || text === undefined || isValue(text);
    afterLabel = text === undefined || isLabel(text);
    return value ? ':id' : segment;
  });
  return shown.length === 0 ? '' : `/${shown.join('/')}`;
}

/** Each parameter's value hidden, its name kept when it is a plain name. undefined: too many. */
function redactQuery(query: string): string | undefined {
  if (query === '') return '';
  if (query.includes(';')) return `?${REDACTED}`;
  const parameters = query.split('&');
  if (parameters.length > MAX_PARAMETERS) return undefined;
  const shown = parameters.map((parameter) => {
    const equals = parameter.indexOf('=');
    if (equals < 0) return REDACTED;
    const name = decoded(parameter.slice(0, equals).replace(/\+/g, ' '));
    if (name === undefined || !/^[A-Za-z0-9_.-]+$/.test(name) || isValue(name)) return REDACTED;
    return `${name}=${REDACTED}`;
  });
  return `?${shown.join('&')}`;
}

/** `raw` as a report may show it. */
export function redactUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return '<unparsed URL>';
  }
  if (url.hostname === '') return '<unparsed URL>';
  if (!hostIsShown(url.hostname)) return `${url.protocol}//${REDACTED}`;
  const authority = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  const path = writtenPath(raw);
  if (path === undefined || readsDifferently(path)) return authority;
  const segments = url.pathname.split('/').slice(1);
  if (segments.length > MAX_SEGMENTS) return authority;
  const query = redactQuery(url.search.slice(1));
  if (query === undefined) return authority;
  return `${authority}${redactPath(segments)}${query}`;
}

/**
 * A redirect's Location header as a report may show it: an absolute URL, or a path on the
 * webhook's origin.
 */
export function redactLocation(location: string, webhook: string): string {
  if (URL.canParse(location)) return redactUrl(location);
  if (location.startsWith('/') && !location.startsWith('//')) {
    return redactUrl(`${new URL(webhook).origin}${location}`);
  }
  return '<unparsed URL>';
}
