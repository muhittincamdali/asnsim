// Records the README and guide demos as terminal SVGs (light and dark) in docs/media/.
//
// Each demo runs the built asnsim (dist/cli/main.js) in a demo folder under .test-work, against
// examples/node-receiver listening on 127.0.0.1:3000 and trusting that folder's test root, as the
// example's README describes. The typed command is `asnsim`, the command Homebrew and the
// release tarball install. Runs use a seed, so transaction IDs repeat; request times vary and the
// demo test compares the SVGs with them masked.
//
// Run with `npm run demo` (builds first).
import { execFile } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createReceiver, Environment } from '../examples/node-receiver/receiver.mjs';
import { type Session, terminalSvg } from './terminal-svg.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MEDIA = `${ROOT}docs/media/`;
export const DEMO_DIR = `${ROOT}.test-work/demo/`;
export const PORT = 3000;
const URL_ = `http://127.0.0.1:${PORT}/notifications`;

export interface Demo {
  name: string;
  args: string[];
  title: string;
  comment: string;
}

export const DEMOS: Demo[] = [
  {
    name: 'init',
    args: ['init'],
    title: 'asnsim init',
    comment: '# a test chain for com.example.app in .asnsim/',
  },
  {
    name: 'checks',
    args: ['run', 'scenarios/entitlements.yaml', '--url', URL_, '--seed', 'demo'],
    title: 'asnsim · entitlements follow the subscription',
    comment: '# examples/node-receiver: Apple’s Node.js library, the asnsim root in tests',
  },
  {
    name: 'trial',
    args: ['run', 'trial-renew-refund', '--url', URL_, '--seed', 'demo', '--duplicate'],
    title: 'asnsim · free trial, renewal, refund, each sent twice',
    comment: '# a built-in scenario; --duplicate sends each notification again',
  },
  {
    name: 'failure',
    args: ['run', 'scenarios/refund-keeps-access.yaml', '--url', URL_, '--seed', 'demo'],
    title: 'asnsim · a check that fails',
    comment: '# the scenario expects access after a refund; the receiver took it away',
  },
  {
    name: 'decode-xcode',
    args: [
      'decode',
      `${ROOT}test/data/xcode/transaction-subscription.jws`,
      '--environment',
      'Xcode',
    ],
    title: 'asnsim decode · a transaction from StoreKit Testing in Xcode',
    comment: '# recorded with Xcode 27.1 on an iOS 27.0 simulator',
  },
];

const run = promisify(execFile);

/**
 * Runs the CLI for one demo in the demo folder and returns what a terminal would have shown. It
 * runs in a child process, so the receiver in this process can answer meanwhile.
 */
export async function record(demo: Demo): Promise<Session> {
  const env: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: '1' };
  delete env.NO_COLOR;
  let output: string;
  try {
    ({ stdout: output } = await run(process.execPath, [`${ROOT}dist/cli/main.js`, ...demo.args], {
      cwd: DEMO_DIR,
      env,
      encoding: 'utf8',
    }));
  } catch (error) {
    // Exit code 1 means a failed delivery or check; the report is still on stdout.
    output = (error as { stdout?: string }).stdout ?? '';
  }
  const shown = demo.args.map((arg) => arg.replace(`${ROOT}`, ''));
  return { title: demo.title, comment: demo.comment, command: `asnsim ${shown.join(' ')}`, output };
}

export const mediaPath = (name: string, theme: 'light' | 'dark') =>
  `${MEDIA}demo-${name}-${theme}.svg`;

/** A fresh demo folder with the receiver's scenarios, and the receiver listening on PORT. */
export async function prepare(): Promise<Server> {
  rmSync(DEMO_DIR, { recursive: true, force: true });
  mkdirSync(`${DEMO_DIR}scenarios`, { recursive: true });
  for (const file of ['entitlements.yaml', 'refund-keeps-access.yaml']) {
    copyFileSync(`${ROOT}examples/node-receiver/scenarios/${file}`, `${DEMO_DIR}scenarios/${file}`);
  }
  // The receiver trusts the root that the first demo, `asnsim init`, writes; it is created on
  // the first request, after that.
  let receiver: ReturnType<typeof createReceiver> | undefined;
  const server = createServer((request, response) => {
    receiver ??= createReceiver({
      roots: [readFileSync(`${DEMO_DIR}.asnsim/root.cer`)],
      environment: Environment.SANDBOX,
      bundleId: 'com.example.app',
    });
    receiver.server.emit('request', request, response);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(MEDIA, { recursive: true });
  const server = await prepare();
  try {
    for (const demo of DEMOS) {
      const session = await record(demo);
      for (const theme of ['light', 'dark'] as const) {
        writeFileSync(mediaPath(demo.name, theme), terminalSvg(session, theme));
      }
      console.log(`docs/media/demo-${demo.name}-{light,dark}.svg`);
    }
  } finally {
    server.close();
  }
}
