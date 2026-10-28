import { Command, CommanderError, InvalidArgumentError } from 'commander';
import { CatalogError, events, findEvent } from '../catalog.js';
import { DecodeError } from '../decode/decode.js';
import { renderScenarios, renderTypes } from '../report/catalog.js';
import { oneLine, REPOSITORY_URL } from '../report/style.js';
import { runScenario, sendAll, sendNotification } from '../run/run.js';
import { builtInScenarios, loadScenario, ScenarioError } from '../scenario/load.js';
import { DurationError } from '../sim/duration.js';
import { SimulationError } from '../sim/simulation.js';
import { VERSION } from '../version.js';
import { WorkspaceError } from '../workspace.js';
import { addDecode, addInit, addPayload } from './commands.js';
import {
  type CliEnvironment,
  type Context,
  EXIT,
  emit,
  readProducts,
  reportRun,
  runOptions,
  UsageError,
} from './context.js';
import {
  type DeliveryOptions,
  deliveryOptions,
  type OutputOptions,
  outputOptions,
  statuses,
} from './options.js';

export { type CliEnvironment, EXIT } from './context.js';

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

  addInit(root, context);

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
  addPayload(root, context);
  addDecode(root, context);

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
