import { DATE_FIELDS, type DecodedPart, type DecodeResult } from '../decode/decode.js';
import { formatName } from '../pki/certificate.js';
import { VERSION } from '../version.js';
import {
  cut,
  type Format,
  markdownCode,
  markdownText,
  oneLine,
  type Paint,
  painter,
  wrap,
} from './style.js';
import type { RenderOptions } from './run.js';

// The report of `asnsim decode`: each JWS with its verification and its fields, dates written
// out, nested JWS shortened (they follow as parts of their own), then problems and notes.

type Row = [key: string, value: string];

function value(key: string, raw: unknown): string {
  if (typeof raw === 'string') {
    if (/^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(raw)) {
      return `${raw.slice(0, 16)}… (JWS, below)`;
    }
    return JSON.stringify(raw);
  }
  if (typeof raw === 'number' && DATE_FIELDS.has(key) && Number.isFinite(raw)) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return `${raw}  ${date.toISOString()}`;
  }
  return JSON.stringify(raw) ?? String(raw);
}

/** The payload as key paths: data.environment, summary.productId … */
export function rows(payload: unknown, prefix = ''): Row[] {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return [[prefix || 'payload', value(prefix, payload)]];
  }
  return Object.entries(payload).flatMap(([key, entry]): Row[] =>
    typeof entry === 'object' && entry !== null && !Array.isArray(entry)
      ? rows(entry, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value(key, entry)]],
  );
}

function status(part: DecodedPart): { text: string; style: 'green' | 'red' | 'yellow' } {
  if (part.skipped === 'xcode') return { text: 'not checked: signed by Xcode', style: 'yellow' };
  if (part.skipped) return { text: 'not checked (--no-verify)', style: 'yellow' };
  const verification = part.verification;
  if (verification?.ok) {
    return { text: `verified · ${oneLine(verification.root ?? '')}`, style: 'green' };
  }
  return { text: 'NOT verified', style: 'red' };
}

function headline(result: DecodeResult): string {
  const checked = result.parts.filter((part) => part.verification);
  if (result.problems.length > 0) {
    return `${result.problems.length} problem${result.problems.length === 1 ? '' : 's'}: do not trust this data`;
  }
  if (checked.length === 0) return `${result.parts.length} JWS decoded, none verified`;
  const roots = [...new Set(checked.map((part) => part.verification?.root))];
  return `${result.parts.length} JWS decoded, ${checked.length} verified against ${roots.join(', ')}`;
}

/** The header's alg as printed: a string from the JWS header, cleaned; anything else as JSON. */
const algorithm = (alg: unknown) =>
  cut(oneLine(typeof alg === 'string' ? alg : (JSON.stringify(alg) ?? 'none')), 40);

const chainKey = (part: DecodedPart) =>
  part.verification?.certificates.map((certificate) => certificate.sha256).join(' ') ?? '';

function plainPart(part: DecodedPart, paint: Paint, width: number, sameChainAs?: string): string[] {
  const state = status(part);
  const lines = [
    `${paint('bold', part.path)}  ${part.kind}  ${paint('dim', `${algorithm(part.header.alg)} · ${part.header.x5c} certificate${part.header.x5c === 1 ? '' : 's'}`)}  ${paint(state.style, state.text)}`,
  ];
  const entries = rows(part.payload);
  const keyWidth = Math.min(Math.max(...entries.map(([key]) => key.length), 8), 34);
  for (const [key, text] of entries) {
    lines.push(
      `  ${paint('cyan', oneLine(key).padEnd(keyWidth))}  ${cut(oneLine(text), width - keyWidth - 4)}`,
    );
  }
  if (part.verification) {
    lines.push(`  ${paint('dim', `checked at ${part.verification.effectiveDate} (signedDate)`)}`);
    if (sameChainAs) {
      lines.push(`  ${paint('dim', `signed with the same chain as ${sameChainAs}`)}`);
      return lines;
    }
    part.verification.certificates.forEach((certificate, index) => {
      const name = cut(oneLine(formatName(certificate.subject)), width - 6);
      lines.push(`  ${paint('dim', `${index + 1}. ${name}`)}`);
      lines.push(
        `     ${paint('dim', `${certificate.notBefore.toISOString().slice(0, 10)} to ${certificate.notAfter.toISOString().slice(0, 10)} · SHA-256 ${certificate.sha256.slice(0, 23)}…`)}`,
      );
    });
  }
  return lines;
}

function plain(result: DecodeResult, options: RenderOptions): string {
  const paint = painter(options.color ?? false);
  const width = Math.max(options.width ?? 100, 60);
  const lines = [
    paint('bold', `asnsim decode · ${result.source}`),
    paint(result.problems.length > 0 ? 'red' : 'green', headline(result)),
    '',
  ];
  result.parts.forEach((part, index) => {
    const earlier = result.parts
      .slice(0, index)
      .find((other) => chainKey(other) !== '' && chainKey(other) === chainKey(part));
    lines.push(...plainPart(part, paint, width, earlier?.path), '');
  });
  if (result.problems.length > 0) {
    lines.push(paint('bold', 'Problems'));
    for (const problem of result.problems) {
      lines.push(
        `  ${paint('red', problem.code)} in ${problem.path}: ${wrap(oneLine(problem.message), width, '    ', problem.code.length + problem.path.length + 7)}`,
      );
      lines.push(`    Fix: ${wrap(oneLine(problem.fix), width, '    ', 9)}`);
    }
    lines.push('');
  }
  for (const note of result.notes)
    lines.push(paint('yellow', wrap(`Note: ${oneLine(note)}`, width, '      ', 0)));
  return `${lines.join('\n').trimEnd()}\n`;
}

function markdown(result: DecodeResult): string {
  const lines = [
    `# asnsim decode: ${markdownText(result.source)}`,
    '',
    `**${markdownText(headline(result))}**`,
  ];
  for (const part of result.parts) {
    lines.push(
      '',
      `## ${markdownText(part.path)} (${part.kind})`,
      '',
      `${markdownText(status(part).text)}`,
      '',
    );
    lines.push('| Field | Value |', '| ----- | ----- |');
    for (const [key, text] of rows(part.payload)) {
      lines.push(`| ${markdownCode(key)} | ${markdownText(text)} |`);
    }
    if (part.verification) {
      lines.push('', `Checked at ${part.verification.effectiveDate}. Chain:`, '');
      for (const certificate of part.verification.certificates) {
        lines.push(
          `- ${markdownText(formatName(certificate.subject))}, SHA-256 \`${certificate.sha256}\``,
        );
      }
    }
  }
  if (result.problems.length > 0) {
    lines.push('', '## Problems', '');
    for (const problem of result.problems) {
      lines.push(
        `- **${problem.code}** in ${markdownCode(problem.path)}: ${markdownText(problem.message)} ${markdownText(problem.fix)}`,
      );
    }
  }
  for (const note of result.notes) lines.push('', `> ${markdownText(note)}`);
  lines.push('', `asnsim ${VERSION}`);
  return `${lines.join('\n')}\n`;
}

export function renderDecode(
  result: DecodeResult,
  format: Format,
  options: RenderOptions = {},
): string {
  if (format === 'json') {
    const parts = result.parts.map((part) => ({
      ...part,
      ...(part.verification
        ? {
            verification: {
              ...part.verification,
              certificates: part.verification.certificates.map((certificate) => ({
                subject: certificate.subject,
                issuer: certificate.issuer,
                serialNumber: certificate.serialNumber,
                notBefore: certificate.notBefore.toISOString(),
                notAfter: certificate.notAfter.toISOString(),
                isCa: certificate.isCa,
                sha256: certificate.sha256,
              })),
            },
          }
        : {}),
    }));
    return `${JSON.stringify({ schemaVersion: 0, tool: { name: 'asnsim', version: VERSION }, ...result, parts }, null, 2)}\n`;
  }
  if (format === 'markdown') return markdown(result);
  return plain(result, { ...options, color: format === 'tty' && (options.color ?? false) });
}
