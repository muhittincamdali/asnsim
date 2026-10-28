import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../helpers/cli.js';
import { scratchDir } from '../helpers/scratch.js';

// The compiled command (dist/cli/main.js, built by test/setup/build.ts), run as a separate
// process the way npx and Homebrew run it.

const BIN = `${ROOT}dist/cli/main.js`;
const asnsim = (args: string[], cwd: string, input?: string) =>
  spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
    ...(input === undefined ? {} : { input }),
  });

describe('dist/cli/main.js', () => {
  it('starts with a shebang and reports the package version', () => {
    expect(readFileSync(BIN, 'utf8').startsWith('#!/usr/bin/env node\n')).toBe(true);
    const { version } = JSON.parse(readFileSync(`${ROOT}package.json`, 'utf8'));
    const result = asnsim(['--version'], ROOT);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(version);
  });

  it('runs init, payload and decode through a pipe', () => {
    const cwd = scratchDir('bin');
    expect(asnsim(['init'], cwd).status).toBe(0);
    const payload = asnsim(['payload', 'DID_RENEW', 'BILLING_RECOVERY'], cwd);
    expect(payload.status).toBe(0);
    const decoded = asnsim(['decode', '-', '--json'], cwd, payload.stdout);
    expect(decoded.status).toBe(0);
    const json = JSON.parse(decoded.stdout);
    expect(json.parts.map((part: { kind: string }) => part.kind)).toEqual([
      'notification',
      'transaction',
      'renewalInfo',
    ]);
    expect(json.parts[0].payload.subtype).toBe('BILLING_RECOVERY');
  });

  it('exits 2 with a message on stderr for a usage error', () => {
    const result = asnsim(
      ['run', 'trial-renew-refund', '--url', 'http://127.0.0.1:1/'],
      scratchDir('bin'),
    );
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Run `asnsim init` first');
  });
});
