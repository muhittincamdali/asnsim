// Shared pieces of the reports: colour, cleaning untrusted text, formats.
//
// Webhook answers and decoded payloads come from outside: a response body or a field of a pasted
// payload could carry terminal escape sequences or bidirectional controls. clean() replaces every
// control character except the line breaks a block may keep, so nothing the report prints can
// move the cursor, change colours or reorder text.

export const FORMATS = ['tty', 'text', 'markdown', 'json'] as const;
export type Format = (typeof FORMATS)[number];

export const REPOSITORY_URL = 'https://github.com/muhittincamdali/asnsim';

export type Style = 'bold' | 'dim' | 'red' | 'yellow' | 'green' | 'cyan' | 'blue';
const CODES: Record<Style, [number, number]> = {
  bold: [1, 22],
  dim: [2, 22],
  red: [31, 39],
  yellow: [33, 39],
  green: [32, 39],
  cyan: [36, 39],
  blue: [34, 39],
};

export type Paint = (style: Style, text: string) => string;

export function painter(color: boolean): Paint {
  return (style, text) => {
    if (!color || text === '') return text;
    const [open, close] = CODES[style];
    return `\u001b[${open}m${text}\u001b[${close}m`;
  };
}

// C0 and C1 controls (tab and line feed kept separately), DEL, and the Unicode bidirectional
// formatting characters.
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point
const CONTROLS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f؜‎‏‪-‮⁦-⁩]/g;

/** Text with control characters shown as U+XXXX, so it prints as it is. */
export function clean(text: string): string {
  return text.replace(
    CONTROLS,
    (char) => `<U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}>`,
  );
}

/** clean() on one line: line breaks and tabs become spaces. */
export const oneLine = (text: string) => clean(text.replace(/[\r\n\t]+/g, ' '));

/** Cuts text to `max` characters with an ellipsis. */
export function cut(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * Wraps text so that no line passes column `width`. The first line starts at column `start` (the
 * text before it on the line); the others start with `indent`.
 */
export function wrap(text: string, width: number, indent = '', start = indent.length): string {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const limit = width - (lines.length === 0 ? start : indent.length);
    if (line && line.length + 1 + word.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.map((entry, index) => (index === 0 ? entry : `${indent}${entry}`)).join('\n');
}

/** Escapes text for a Markdown table cell or paragraph. */
export function markdownText(text: string): string {
  return oneLine(text).replace(/([\\`*_[\]<>|#])/g, '\\$1');
}

export const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;
