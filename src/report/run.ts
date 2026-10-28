import type { Attempt, RunResult, StepResult } from '../run/run.js';
import { VERSION } from '../version.js';
import {
  cut,
  type Format,
  markdownText,
  oneLine,
  type Paint,
  painter,
  plural,
  wrap,
} from './style.js';

// The report of `asnsim run` and `asnsim send`: one line per notification with the answer, the
// check under it, and for each failure what happened and how to fix it.

export interface RenderOptions {
  color?: boolean;
  width?: number;
}

const NAME_WIDTH = 40;

function answer(attempt: Attempt | undefined): string {
  if (!attempt) return '—';
  if (attempt.status !== undefined) return String(attempt.status);
  return attempt.timedOut ? 'timeout' : 'no answer';
}

function verdict(result: RunResult): string {
  const { steps, passed, failed, requests } = result.counts;
  if (result.dryRun) return `${plural(steps, 'notification')} signed, none sent (dry run)`;
  const head = `${passed} of ${plural(steps, 'notification')} delivered as the App Store expects`;
  return `${head}${failed > 0 ? ` · ${failed} failed` : ''} · ${plural(requests, 'request')}`;
}

function attemptsLine(step: StepResult): string {
  if (step.attempts.length <= 1) return '';
  return step.attempts.map((attempt) => `${attempt.kind} ${answer(attempt)}`).join(', ');
}

function plainStep(step: StepResult, paint: Paint, width: number): string[] {
  const last = step.attempts.at(-1);
  const status = step.attempts.length === 0 ? 'signed' : answer(step.attempts[0]);
  const ms = last ? `${last.ms} ms` : '';
  const mark = step.ok ? paint('green', 'ok') : paint('red', 'failed');
  const number = String(step.index).padStart(3);
  const name = cut(oneLine(step.name), NAME_WIDTH).padEnd(NAME_WIDTH);
  const lines = [
    `${number}  ${paint('bold', name)} ${status.padStart(9)} ${ms.padStart(8)}  ${mark}`,
  ];
  const indent = '       ';
  const retries = attemptsLine(step);
  if (retries) lines.push(`${indent}${paint('dim', retries)}`);
  if (step.check) {
    const check = step.check;
    const got = check.status === undefined ? (check.error ?? 'no answer') : String(check.status);
    lines.push(
      `${indent}${paint('dim', `check ${check.method} ${cut(oneLine(check.url), 70)} → ${got}`)} ${check.ok ? paint('green', 'ok') : paint('red', 'failed')}`,
    );
  }
  if (step.file) lines.push(`${indent}${paint('dim', `wrote ${oneLine(step.file)}`)}`);
  for (const finding of step.findings) {
    lines.push(
      `${indent}${paint('red', finding.code)}: ${wrap(oneLine(finding.message), width, indent, indent.length + finding.code.length + 2)}`,
    );
    const body = step.attempts.find((attempt) => attempt.body)?.body;
    if (body && (finding.code === 'rejected' || finding.code === 'unexpected-status')) {
      lines.push(`${indent}${paint('dim', `answer: ${cut(oneLine(body), width - 15)}`)}`);
    }
    lines.push(`${indent}How to fix:`);
    for (const fix of finding.fix.steps) {
      lines.push(`${indent}- ${wrap(oneLine(fix), width, `${indent}  `)}`);
    }
    lines.push(`${indent}${paint('blue', finding.fix.guide)}`);
  }
  return lines;
}

function plain(result: RunResult, options: RenderOptions): string {
  const paint = painter(options.color ?? false);
  const width = Math.max(options.width ?? 100, 60);
  const target = result.url ? ` → ${oneLine(result.url)}` : '';
  const lines = [paint('bold', `asnsim · ${oneLine(result.scenario)}${target}`)];
  if (result.description) lines.push(wrap(oneLine(result.description), width, '', 0));
  lines.push(
    paint(
      'dim',
      `${result.environment} · ${result.bundleId} · ${result.clock === 'live' ? 'dated when sent' : 'dated by the scenario'}`,
    ),
  );
  lines.push('');
  for (const step of result.steps) lines.push(...plainStep(step, paint, width));
  lines.push('');
  lines.push(paint(result.ok ? 'green' : 'red', verdict(result)));
  return `${lines.join('\n')}\n`;
}

function markdown(result: RunResult): string {
  const lines = [`# asnsim: ${markdownText(result.scenario)}`, ''];
  if (result.description) lines.push(markdownText(result.description), '');
  lines.push(
    `- Webhook: ${result.url ? `\`${oneLine(result.url)}\`` : 'none (dry run)'}`,
    `- App: \`${result.bundleId}\`, ${result.environment}`,
    `- Dates: ${result.clock === 'live' ? 'each notification dated when it was sent' : 'the scenario’s own'}`,
    `- asnsim ${VERSION}`,
    '',
    '| # | Notification | Answer | Time | Check | Result |',
    '| - | ------------ | ------ | ---- | ----- | ------ |',
  );
  for (const step of result.steps) {
    const last = step.attempts.at(-1);
    const check = step.check
      ? `${step.check.status ?? 'no answer'} ${step.check.ok ? 'ok' : 'failed'}`
      : '';
    lines.push(
      `| ${step.index} | ${markdownText(step.name)} | ${step.attempts.map(answer).join(', ') || 'signed'} | ${last ? `${last.ms} ms` : ''} | ${check} | ${step.ok ? 'ok' : `**${step.findings.map((entry) => entry.code).join(', ')}**`} |`,
    );
  }
  lines.push('', `**${verdict(result)}**`);
  const failed = result.steps.filter((step) => !step.ok);
  if (failed.length > 0) lines.push('', '## Failures');
  for (const step of failed) {
    for (const finding of step.findings) {
      lines.push('', `### ${step.index}. ${markdownText(step.name)}: ${finding.code}`, '');
      lines.push(markdownText(finding.message), '');
      for (const fix of finding.fix.steps) lines.push(`- ${markdownText(fix)}`);
      lines.push('', `[Troubleshooting guide](${finding.fix.guide})`);
    }
  }
  return `${lines.join('\n')}\n`;
}

/** The run report in one of the formats. JSON has the whole result. */
export function renderRun(result: RunResult, format: Format, options: RenderOptions = {}): string {
  if (format === 'json') {
    return `${JSON.stringify({ schemaVersion: 0, tool: { name: 'asnsim', version: VERSION }, ...result }, null, 2)}\n`;
  }
  if (format === 'markdown') return markdown(result);
  return plain(result, { ...options, color: format === 'tty' && (options.color ?? false) });
}
