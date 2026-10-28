import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderRun } from '../report/run.js';
import type { Format } from '../report/style.js';
import type { RunResult } from '../run/run.js';
import { loadScenario } from '../scenario/load.js';
import { normalizeProducts, type Product } from '../sim/products.js';
import { loadWorkspace } from '../workspace.js';
import type { DeliveryOptions, OutputOptions } from './options.js';

// What every command shares: the environment it runs in, its exit code, and writing its report.

/** Exit codes; documented in the README and `--help`. */
export const EXIT = { ok: 0, findings: 1, error: 2 } as const;

/** Everything the CLI touches outside its arguments, so tests can run it in-process. */
export interface CliEnvironment {
  cwd: string;
  env: Record<string, string | undefined>;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** Reads all of standard input, for `asnsim decode -`. */
  stdin?: () => Promise<string>;
  stdoutIsTty: boolean;
  columns?: number | undefined;
  /** For tests: the clock and the HTTP client of runs. */
  now?: () => Date;
  fetch?: typeof fetch;
}

export class UsageError extends Error {
  override name = 'UsageError';
}

export interface Context {
  io: CliEnvironment;
  code: number;
}

function useColor(options: OutputOptions, io: CliEnvironment): boolean {
  if (options.format !== 'tty' || options.output || !options.color) return false;
  if (io.env.NO_COLOR) return false;
  if (io.env.FORCE_COLOR && io.env.FORCE_COLOR !== '0') return true;
  return io.stdoutIsTty;
}

export async function emit(
  context: Context,
  options: OutputOptions,
  render: (format: Format, color: boolean, width: number) => string,
  summary: string,
) {
  const format = options.json ? 'json' : options.format;
  const width =
    context.io.stdoutIsTty && context.io.columns ? Math.min(context.io.columns, 100) : 100;
  const text = render(format, useColor({ ...options, format }, context.io), width);
  if (options.output) {
    await writeFile(resolve(context.io.cwd, options.output), text);
    context.io.stderr(`Wrote ${options.output}: ${summary}\n`);
  } else {
    context.io.stdout(text);
  }
}

export function workspaceFor(context: Context, dir: string) {
  return loadWorkspace(resolve(context.io.cwd, dir));
}

export async function reportRun(context: Context, options: DeliveryOptions, result: RunResult) {
  const summary = result.dryRun
    ? `${result.counts.steps} signed, none sent`
    : `${result.counts.passed} of ${result.counts.steps} passed`;
  await emit(
    context,
    options,
    (format, color, width) => renderRun(result, format, { color, width }),
    summary,
  );
  context.code = result.ok ? EXIT.ok : EXIT.findings;
}

export function runOptions(context: Context, options: DeliveryOptions) {
  return {
    workspace: workspaceFor(context, options.dir),
    ...(options.url ? { url: options.url } : {}),
    ...(options.clock ? { clock: options.clock } : {}),
    ...(options.start ? { start: options.start } : {}),
    ...(options.seed ? { seed: options.seed } : {}),
    retries: options.retries,
    ...(options.duplicate ? { duplicate: true } : {}),
    timeoutMs: options.timeout,
    ...(options.header ? { headers: options.header } : {}),
    ...(options.out ? { outDir: resolve(context.io.cwd, options.out) } : {}),
    ...(options.dryRun ? { dryRun: true } : {}),
    ...(context.io.fetch ? { fetch: context.io.fetch } : {}),
    ...(context.io.now ? { now: context.io.now } : {}),
  };
}

export async function readProducts(
  context: Context,
  file: string | undefined,
): Promise<Product[] | undefined> {
  if (!file) return undefined;
  const scenario = loadScenario(resolve(context.io.cwd, file), context.io.cwd);
  if (!scenario.products) throw new UsageError(`${file} has no products.`);
  return normalizeProducts(scenario.products);
}
