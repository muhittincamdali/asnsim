#!/usr/bin/env node
import { readLimited } from './input.js';
import { run } from './run.js';

const stdin = async () => (await readLimited(process.stdin)).toString('utf8');

process.exitCode = await run(process.argv.slice(2), {
  cwd: process.cwd(),
  env: process.env,
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  stdin,
  stdoutIsTty: process.stdout.isTTY === true,
  columns: process.stdout.columns,
});
