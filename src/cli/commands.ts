import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { type Command, Option } from 'commander';
import { DecodeError, decode } from '../decode/decode.js';
import { readCertificates } from '../pki/certificate.js';
import type { TrustedRoot } from '../pki/verify.js';
import { renderDecode } from '../report/decode.js';
import { REPOSITORY_URL } from '../report/style.js';
import { buildParts, signParts } from '../sim/payloads.js';
import { Simulation } from '../sim/simulation.js';
import { standaloneSteps } from '../sim/standalone.js';
import {
  DEFAULT_APP,
  DEFAULT_DIR,
  ENVIRONMENTS,
  type Environment,
  FILES,
  initWorkspace,
} from '../workspace.js';
import {
  type CliEnvironment,
  type Context,
  EXIT,
  emit,
  readProducts,
  UsageError,
  workspaceFor,
} from './context.js';
import { InputTooLarge, readFileLimited } from './input.js';
import { date, integer, type OutputOptions, outputOptions } from './options.js';

// The commands that do not deliver: init, payload and decode.

/** `asnsim init`: writes the test chain and the app settings. */
export function addInit(root: Command, context: Context): void {
  const { io } = context;
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
}

/** `asnsim payload`: prints one notification body without sending it. */
export function addPayload(root: Command, context: Context): void {
  const { io } = context;
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
}

/** The bytes of a file decode reads, at most 2 MB of them. */
async function readSmallFile(path: string, shown: string): Promise<Buffer> {
  try {
    return await readFileLimited(path);
  } catch (error) {
    if (error instanceof InputTooLarge) throw new DecodeError(`${shown} is ${error.message}.`);
    throw new UsageError(`Cannot read ${shown}.`);
  }
}

/** The text to decode: standard input for `-`, a file when one is there, else the token itself. */
async function readInput(io: CliEnvironment, input: string): Promise<string> {
  if (input === '-') {
    if (!io.stdin)
      throw new UsageError('Give a file or the token, or pipe it into asnsim decode -.');
    try {
      return await io.stdin();
    } catch (error) {
      if (error instanceof InputTooLarge) throw new DecodeError(`The input is ${error.message}.`);
      throw error;
    }
  }
  const file = resolve(io.cwd, input);
  return existsSync(file) ? (await readSmallFile(file, input)).toString('utf8') : input;
}

/** The test root in `dir` when it exists, and every certificate in the `--root` files. */
async function trustedRoots(
  io: CliEnvironment,
  dir: string,
  files: string[],
): Promise<TrustedRoot[]> {
  const roots: TrustedRoot[] = [];
  const testRoot = resolve(io.cwd, dir, FILES.rootDer);
  if (existsSync(testRoot)) {
    roots.push({
      label: `asnsim test root (${join(dir, FILES.rootDer)})`,
      der: Uint8Array.from(await readSmallFile(testRoot, join(dir, FILES.rootDer))),
    });
  }
  for (const file of files) {
    const bytes = await readSmallFile(resolve(io.cwd, file), file);
    for (const der of readCertificates(Uint8Array.from(bytes))) roots.push({ label: file, der });
  }
  return roots;
}

/** `asnsim decode`: decodes and verifies what the App Store sent. */
export function addDecode(root: Command, context: Context): void {
  const { io } = context;
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
      const text = await readInput(io, input);
      const roots = await trustedRoots(io, options.dir, options.root ?? []);
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
}
