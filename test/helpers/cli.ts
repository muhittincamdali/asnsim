import { fileURLToPath } from 'node:url';
import { type CliEnvironment, run } from '../../src/cli/run.js';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Runs the CLI in-process, as a terminal would but with captured output. */
export async function asnsim(
  args: string[],
  options: Partial<Pick<CliEnvironment, 'cwd' | 'env' | 'now' | 'fetch' | 'stdoutIsTty'>> & {
    stdin?: string;
  } = {},
): Promise<CliResult> {
  let stdout = '';
  let stderr = '';
  const code = await run(args, {
    cwd: options.cwd ?? ROOT,
    env: options.env ?? {},
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
    ...(options.stdin === undefined ? {} : { stdin: async () => options.stdin ?? '' }),
    stdoutIsTty: options.stdoutIsTty ?? false,
    columns: 100,
    ...(options.now ? { now: options.now } : {}),
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  return { code, stdout, stderr };
}

/** Report text with request times replaced, so it can be compared with a snapshot. */
export const stableTimes = (text: string) =>
  text.replace(/\b\d+ ms\b/g, 'N ms').replace(/"ms": \d+/g, '"ms": 0');
