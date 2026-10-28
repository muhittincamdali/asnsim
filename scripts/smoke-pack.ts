// Packs the package as npm would publish it, installs the tarball into a prefix inside the
// repository (the way `npx` and the Homebrew formula install it) and runs the installed binary:
// --version, then init, payload and decode in a scratch folder. Run after `npm run build`:
// `node scripts/smoke-pack.ts`. Needs the network for the three runtime dependencies.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(readFileSync(`${root}package.json`, 'utf8')) as { version: string };
mkdirSync(fileURLToPath(new URL('../.test-work/', import.meta.url)), { recursive: true });
const work = mkdtempSync(fileURLToPath(new URL('../.test-work/pack-', import.meta.url)));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (command: string, args: string[], cwd = root) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });

try {
  const [packed] = JSON.parse(
    run(npm, ['pack', '--json', '--ignore-scripts', '--pack-destination', work]),
  ) as { filename: string; files: { path: string }[] }[];
  if (!packed) throw new Error('npm pack wrote nothing');
  const paths = packed.files.map(({ path }) => path);
  for (const required of [
    'dist/cli/main.js',
    'dist/index.js',
    'dist/index.d.ts',
    'catalog/notifications.json',
    'scenarios/trial-renew-refund.yaml',
    'LICENSE',
  ]) {
    if (!paths.includes(required)) throw new Error(`The package is missing ${required}`);
  }
  const unexpected = paths.filter(
    (path) =>
      /^(src|test|scripts|docs|examples|_work|\.asnsim)\//.test(path) || path.endsWith('.map'),
  );
  if (unexpected.length > 0) throw new Error(`The package includes ${unexpected.join(', ')}`);

  const prefix = join(work, 'prefix');
  run(npm, [
    'install',
    '--global',
    '--prefix',
    prefix,
    '--no-audit',
    '--no-fund',
    join(work, packed.filename),
  ]);
  const bin = join(prefix, process.platform === 'win32' ? 'asnsim.cmd' : 'bin/asnsim');
  const reported = run(bin, ['--version']).trim();
  if (reported !== version) throw new Error(`--version printed ${reported}, expected ${version}`);

  const project = join(work, 'project');
  mkdirSync(project);
  run(bin, ['init'], project);
  const body = run(bin, ['payload', 'REFUND'], project);
  const decoded = spawnSync(bin, ['decode', '-'], {
    cwd: project,
    input: body,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (decoded.status !== 0 || !decoded.stdout.includes('3 JWS decoded, 3 verified')) {
    throw new Error(
      `Unexpected decode (exit ${decoded.status}):\n${decoded.stdout}${decoded.stderr}`,
    );
  }
  const scenarios = run(bin, ['scenarios', '--json'], project);
  if (JSON.parse(scenarios).scenarios.length !== 9)
    throw new Error('The built-in scenarios are missing');
  console.log(
    `${packed.filename}: ${paths.length} files, installed binary reports ${reported}, init, payload and decode work.`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
