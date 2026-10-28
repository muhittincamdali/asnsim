import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Command, CommanderError, InvalidArgumentError, Option } from 'commander';
import { CatalogError, events, findEvent } from '../catalog.js';
import { DecodeError, decode } from '../decode/decode.js';
import { readCertificates } from '../pki/certificate.js';
import type { TrustedRoot } from '../pki/verify.js';
import { renderScenarios, renderTypes } from '../report/catalog.js';
import { renderDecode } from '../report/decode.js';
import { renderRun } from '../report/run.js';
import { FORMATS, type Format, oneLine, REPOSITORY_URL } from '../report/style.js';
import { type RunResult, runScenario, sendAll, sendNotification } from '../run/run.js';
import { builtInScenarios, loadScenario, ScenarioError } from '../scenario/load.js';
import { DurationError } from '../sim/duration.js';
import { buildParts, signParts } from '../sim/payloads.js';
import { normalizeProducts, type Product } from '../sim/products.js';
import { Simulation, SimulationError } from '../sim/simulation.js';
import { standaloneSteps } from '../sim/standalone.js';
import { VERSION } from '../version.js';
import {
  DEFAULT_APP,
  DEFAULT_DIR,
  ENVIRONMENTS,
  type Environment,
  FILES,
  initWorkspace,
  loadWorkspace,
  WorkspaceError,
} from '../workspace.js';

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

/** Errors that are the user's to fix: exit 2 with the message, no bug report request. */
const USAGE_ERRORS = [
  WorkspaceError,
  ScenarioError,
  CatalogError,
  SimulationError,
  DecodeError,
  DurationError,
  InvalidArgumentError,
];

class UsageError extends Error {
  override name = 'UsageError';
}

const integer = (name: string, min: number, max: number) => (value: string) => {
  const number = Number(value);
  if (!/^\d+$/.test(value) || number < min || number > max) {
    throw new InvalidArgumentError(`${name} is a whole number from ${min} to ${max}.`);
  }
  return number;
};

const date = (value: string) => {
  const parsed = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(value) || Number.isNaN(parsed.getTime())) {
    throw new InvalidArgumentError('an ISO 8601 date such as 2026-10-01T09:00:00Z.');
  }
  return parsed;
};

const header = (value: string, previous: Record<string, string> = {}) => {
  const match = /^([A-Za-z0-9!#$%&'*+.^_`|~-]+):\s*(.*)$/.exec(value);
  if (!match?.[1])
    throw new InvalidArgumentError('a header such as "Authorization: Bearer token".');
  return { ...previous, [match[1].toLowerCase()]: match[2] ?? '' };
};

const statuses = (value: string) =>
  value.split(',').map((part) => {
    const number = Number(part.trim());
    if (!Number.isInteger(number) || number < 100 || number > 599) {
      throw new InvalidArgumentError('HTTP status codes such as 200 or 200,202.');
    }
    return number;
  });

interface OutputOptions {
  format: Format;
  json?: boolean;
  output?: string;
  color: boolean;
}

interface DeliveryOptions extends OutputOptions {
  dir: string;
  url?: string;
  clock?: 'live' | 'fixed';
  start?: Date;
  seed?: string;
  retries: number;
  duplicate?: boolean;
  timeout: number;
  header?: Record<string, string>;
  out?: string;
  dryRun?: boolean;
}

function outputOptions(command: Command): Command {
  return command
    .addOption(new Option('-f, --format <format>', 'report format').choices(FORMATS).default('tty'))
    .option('--json', 'same as --format json')
    .option('-o, --output <file>', 'write the report to a file instead of stdout')
    .option('--no-color', 'plain text even in a terminal');
}

function deliveryOptions(command: Command): Command {
  return outputOptions(
    command
      .option('-u, --url <url>', 'webhook URL that receives the notifications')
      .option('-d, --dir <folder>', 'folder asnsim init wrote', DEFAULT_DIR)
      .addOption(
        new Option('--clock <clock>', 'live: dated when sent; fixed: the scenario’s dates').choices(
          ['live', 'fixed'],
        ),
      )
      .option('--start <date>', 'date of the first event (makes the clock fixed)', date)
      .option('--seed <text>', 'seed for transaction IDs and notificationUUIDs')
      .option(
        '--retries <n>',
        'resend a failed notification up to n times (0-5)',
        integer('--retries', 0, 5),
        0,
      )
      .option('--duplicate', 'send every notification twice')
      .option(
        '--timeout <ms>',
        'time limit per request',
        integer('--timeout', 100, 600_000),
        10_000,
      )
      .option('-H, --header <header>', 'extra request header, repeatable', header)
      .option('--out <folder>', 'also write each request body to this folder')
      .option('--dry-run', 'sign and write the notifications, send nothing'),
  );
}

const HELP_AFTER = `
Exit codes:
  0  every notification passed (answered 200-206, checks matched); decode verified
  1  a delivery, expectation or check failed; decode found a problem
  2  bad arguments, no test chain, a scenario that does not load, or an unexpected error

Start:
  asnsim init                                   writes the test chain to .asnsim/
  asnsim run trial-renew-refund --url http://localhost:3000/notifications
  asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
  asnsim decode notification.json               decodes and verifies what the App Store sent

Docs: ${REPOSITORY_URL}#readme`;

interface Context {
  io: CliEnvironment;
  code: number;
}

function useColor(options: OutputOptions, io: CliEnvironment): boolean {
  if (options.format !== 'tty' || options.output || !options.color) return false;
  if (io.env.NO_COLOR) return false;
  if (io.env.FORCE_COLOR && io.env.FORCE_COLOR !== '0') return true;
  return io.stdoutIsTty;
}

async function emit(
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

function workspaceFor(context: Context, dir: string) {
  return loadWorkspace(resolve(context.io.cwd, dir));
}

async function reportRun(context: Context, options: DeliveryOptions, result: RunResult) {
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

function runOptions(context: Context, options: DeliveryOptions) {
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

async function readProducts(
  context: Context,
  file: string | undefined,
): Promise<Product[] | undefined> {
  if (!file) return undefined;
  const scenario = loadScenario(resolve(context.io.cwd, file), context.io.cwd);
  if (!scenario.products) throw new UsageError(`${file} has no products.`);
  return normalizeProducts(scenario.products);
}

function program(context: Context): Command {
  const { io } = context;
  const root = new Command('asnsim')
    .description(
      'Simulates App Store Server Notifications V2 on your machine: signed notifications from a local test certificate chain, posted to your webhook.',
    )
    .version(VERSION, '-v, --version')
    .addHelpText('after', HELP_AFTER)
    .showHelpAfterError('(add --help for usage)')
    .exitOverride()
    .configureOutput({
      writeOut: io.stdout,
      writeErr: io.stderr,
      outputError: (text, write) => write(text),
    });

  root
    .command('init')
    .description('write a test certificate chain and the app settings to .asnsim/')
    .option('-d, --dir <folder>', 'folder to write', DEFAULT_DIR)
    .option('--bundle-id <id>', 'bundle ID of your app', DEFAULT_APP.bundleId)
    .option(
      '--bundle-version <version>',
      'bundleVersion in notifications',
      DEFAULT_APP.bundleVersion,
    )
    .addOption(
      new Option('--environment <name>', 'Sandbox or Production')
        .choices(ENVIRONMENTS)
        .default('Sandbox'),
    )
    .option(
      '--app-apple-id <id>',
      'app Apple ID (needed for Production)',
      integer('--app-apple-id', 1, Number.MAX_SAFE_INTEGER),
    )
    .option('--force', 'replace an existing test chain')
    .action(
      async (options: {
        dir: string;
        bundleId: string;
        bundleVersion: string;
        environment: Environment;
        appAppleId?: number;
        force?: boolean;
      }) => {
        const files = initWorkspace(
          resolve(io.cwd, options.dir),
          {
            bundleId: options.bundleId,
            bundleVersion: options.bundleVersion,
            environment: options.environment,
            ...(options.appAppleId === undefined ? {} : { appAppleId: options.appAppleId }),
          },
          { ...(options.force ? { force: true } : {}) },
        );
        const rootFile = join(options.dir, FILES.rootDer);
        io.stdout(
          [
            `Wrote a test chain for ${options.bundleId} (${options.environment}) to ${options.dir}/:`,
            ...files.map((file) => `  ${file.slice(resolve(io.cwd, options.dir).length + 1)}`),
            '',
            'Next:',
            `  1. In your backend's tests, give Apple's SignedDataVerifier ${rootFile} as the root,`,
            '     with online checks off. Never in production: it trusts this test chain.',
            '  2. Start the backend, then send notifications:',
            '       asnsim run trial-renew-refund --url http://localhost:3000/notifications',
            `  Guide: ${REPOSITORY_URL}/blob/main/docs/guides/trust-the-test-root.md`,
            '',
          ].join('\n'),
        );
      },
    );

  deliveryOptions(
    root
      .command('run')
      .description('send the notifications of a scenario, built-in or a .yaml/.json file')
      .argument('<scenario>', `built-in name (${builtInScenarios().join(', ')}) or file`),
  ).action(async (name: string, options: DeliveryOptions) => {
    const scenario = loadScenario(name, io.cwd);
    await reportRun(context, options, await runScenario(scenario, runOptions(context, options)));
  });

  deliveryOptions(
    root
      .command('send')
      .description(
        'send one notification, after playing the history it needs; --all sends each type',
      )
      .argument('[type]', 'notificationType, such as DID_RENEW')
      .argument('[subtype]', 'subtype, such as BILLING_RECOVERY')
      .option('--all', 'send each of the 40 type and subtype pairs once')
      .option('--product <id>', 'product of the notification')
      .option('--products <file>', 'scenario file whose products replace the defaults')
      .option(
        '--expect <statuses>',
        'status the webhook must answer with, such as 200 or 200,202',
        statuses,
      ),
  ).action(
    async (
      type: string | undefined,
      subtype: string | undefined,
      options: DeliveryOptions & {
        all?: boolean;
        product?: string;
        products?: string;
        expect?: number[];
      },
    ) => {
      const products = await readProducts(context, options.products);
      const shared = {
        ...runOptions(context, options),
        ...(products ? { products } : {}),
        ...(options.product ? { product: options.product } : {}),
        ...(options.expect ? { expect: options.expect } : {}),
      };
      if (options.all) {
        if (type) throw new UsageError('--all sends every type; leave out the type.');
        await reportRun(context, options, await sendAll(shared));
        return;
      }
      if (!type)
        throw new UsageError(
          'Name a notification type, such as DID_RENEW, or pass --all. `asnsim types` lists them.',
        );
      await reportRun(context, options, await sendNotification(type, subtype, shared));
    },
  );

  root
    .command('payload')
    .description('print the request body of one notification without sending it')
    .argument('<type>', 'notificationType')
    .argument('[subtype]', 'subtype')
    .option('-d, --dir <folder>', 'folder asnsim init wrote', DEFAULT_DIR)
    .option('--decoded', 'print the decoded payloads instead of the signed body')
    .option('--product <id>', 'product of the notification')
    .option('--products <file>', 'scenario file whose products replace the defaults')
    .option('--start <date>', 'date of the history’s first event', date)
    .option('--seed <text>', 'seed for transaction IDs and notificationUUIDs')
    .action(
      async (
        type: string,
        subtype: string | undefined,
        options: {
          dir: string;
          decoded?: boolean;
          product?: string;
          products?: string;
          start?: Date;
          seed?: string;
        },
      ) => {
        const workspace = workspaceFor(context, options.dir);
        const products = await readProducts(context, options.products);
        const { steps } = standaloneSteps(type, subtype, {
          ...(options.product ? { product: options.product } : {}),
          ...(products ? { products } : {}),
        });
        const now = io.now?.() ?? new Date();
        const sim = new Simulation({
          app: workspace.app,
          ...(products ? { products } : {}),
          start: options.start ?? now,
          ...(options.seed ? { seed: options.seed } : {}),
        });
        const played = steps.map((step) => sim.apply(step));
        const last = played.at(-1);
        if (!last) throw new UsageError('Nothing to sign.');
        const shift = options.start ? 0 : now.getTime() - last.at.getTime();
        const signed = signParts(buildParts(sim, last, shift), workspace.chain);
        const { signedPayload, ...decoded } = signed;
        io.stdout(
          `${JSON.stringify(options.decoded ? decoded : { signedPayload }, null, options.decoded ? 2 : 0)}\n`,
        );
      },
    );

  outputOptions(
    root
      .command('decode')
      .description('decode and verify a notification body, signedPayload or signed transaction')
      .argument('[input]', 'a file, the token itself, or - for standard input', '-')
      .option(
        '-d, --dir <folder>',
        'trust the test root in this folder when it exists',
        DEFAULT_DIR,
      )
      .option(
        '-r, --root <file>',
        'also trust this root certificate (DER or PEM), repeatable',
        (value: string, previous: string[] = []) => [...previous, value],
      )
      .option('--no-apple-root', 'do not trust Apple Root CA - G3')
      .option('--no-verify', 'decode only')
      .option('--bundle-id <id>', 'fail unless the data is for this bundle ID')
      .addOption(
        new Option(
          '--environment <name>',
          'fail unless the data is from this environment; Xcode reads StoreKit Testing data without verifying it',
        ).choices([...ENVIRONMENTS, 'Xcode']),
      ),
  ).action(
    async (
      input: string,
      options: OutputOptions & {
        dir: string;
        root?: string[];
        appleRoot: boolean;
        verify: boolean;
        bundleId?: string;
        environment?: string;
      },
    ) => {
      let text: string;
      if (input === '-') {
        if (!io.stdin)
          throw new UsageError('Give a file or the token, or pipe it into asnsim decode -.');
        text = await io.stdin();
      } else if (existsSync(resolve(io.cwd, input))) {
        text = await readFile(resolve(io.cwd, input), 'utf8');
      } else {
        text = input;
      }
      const roots: TrustedRoot[] = [];
      const testRoot = resolve(io.cwd, options.dir, FILES.rootDer);
      if (existsSync(testRoot)) {
        roots.push({
          label: `asnsim test root (${join(options.dir, FILES.rootDer)})`,
          der: Uint8Array.from(await readFile(testRoot)),
        });
      }
      for (const file of options.root ?? []) {
        const bytes = await readFile(resolve(io.cwd, file)).catch(() => {
          throw new UsageError(`Cannot read ${file}.`);
        });
        for (const der of readCertificates(Uint8Array.from(bytes)))
          roots.push({ label: file, der });
      }
      const result = decode(text, {
        verify: options.verify,
        roots,
        ...(options.appleRoot ? {} : { withoutAppleRoot: true }),
        ...(options.bundleId ? { bundleId: options.bundleId } : {}),
        ...(options.environment ? { environment: options.environment } : {}),
      });
      await emit(
        context,
        options,
        (format, color, width) => renderDecode(result, format, { color, width }),
        result.ok ? 'no problems' : `${result.problems.length} problems`,
      );
      context.code = result.ok ? EXIT.ok : EXIT.findings;
    },
  );

  outputOptions(
    root
      .command('types')
      .description('list every notification type and subtype asnsim sends')
      .argument('[type]', 'only this notificationType'),
  ).action(async (type: string | undefined, options: OutputOptions) => {
    const upper = type?.toUpperCase();
    const list = upper ? events().filter((event) => event.type === upper) : events();
    if (type && list.length === 0) findEvent(type);
    await emit(
      context,
      options,
      (format, color, width) => renderTypes(list, format, { color, width }),
      `${list.length} notifications`,
    );
  });

  outputOptions(
    root
      .command('scenarios')
      .description('list the built-in scenarios, or show one')
      .argument('[name]', 'a built-in scenario or a scenario file'),
  ).action(async (name: string | undefined, options: OutputOptions) => {
    const scenarios = name
      ? [loadScenario(name, io.cwd)]
      : builtInScenarios().map((entry) => loadScenario(entry));
    await emit(
      context,
      options,
      (format, color, width) => renderScenarios(scenarios, format, { color, width }),
      `${scenarios.length} scenarios`,
    );
  });

  return root;
}

/** Runs the CLI with the given arguments (without `node` and the script) and returns the exit code. */
export async function run(argv: readonly string[], environment: CliEnvironment): Promise<number> {
  const io = { ...environment, stderr: (text: string) => environment.stderr(text) };
  const context: Context = { io, code: EXIT.ok };
  const command = program(context);
  try {
    if (argv.length === 0) {
      command.outputHelp();
      return EXIT.error;
    }
    await command.parseAsync([...argv], { from: 'user' });
    return context.code;
  } catch (error) {
    if (error instanceof CommanderError) return error.exitCode === 0 ? EXIT.ok : EXIT.error;
    const message = oneLine(error instanceof Error ? error.message : String(error));
    io.stderr(`asnsim: ${message}\n`);
    const known = error instanceof UsageError || USAGE_ERRORS.some((type) => error instanceof type);
    if (!known) {
      io.stderr(`This looks like a bug in asnsim; please report it at ${REPOSITORY_URL}/issues\n`);
    }
    return EXIT.error;
  }
}
