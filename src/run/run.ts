import { eventName, events } from '../catalog.js';
import { redactUrl } from '../redact/url.js';
import { ScenarioError } from '../scenario/load.js';
import type { Scenario } from '../scenario/schema.js';
import { normalizeProducts, type Product } from '../sim/products.js';
import { Simulation } from '../sim/simulation.js';
import { standaloneSteps } from '../sim/standalone.js';
import { checkTarget } from './check.js';
import type { Clock, RunOptions, RunResult, StepResult } from './result.js';
import { execute, type PlanStep } from './step.js';

// Plays a scenario against a webhook: for each step, sign the notification, POST it, compare the
// answer with what the App Store accepts (or what the step expects), resend it when asked, and
// run the step's check against the backend (step.ts, check.ts).

export { containsJson } from './check.js';
export type { Attempt, CheckResult, Clock, RunOptions, RunResult, StepResult } from './result.js';

function clockFor(options: RunOptions, start: Date | undefined): Clock {
  return options.clock ?? (start ? 'fixed' : 'live');
}

function summarize(
  base: Omit<RunResult, 'ok' | 'counts' | 'steps'>,
  steps: StepResult[],
): RunResult {
  const failed = steps.filter((step) => !step.ok).length;
  return {
    ...base,
    steps,
    ok: failed === 0,
    counts: {
      steps: steps.length,
      passed: steps.length - failed,
      failed,
      requests: steps.reduce((sum, step) => sum + step.attempts.length + (step.check ? 1 : 0), 0),
    },
  };
}

function checkUrl(options: RunOptions): void {
  if (options.dryRun) return;
  if (!options.url) throw new ScenarioError('Give the webhook URL with --url, or use --dry-run.');
  let url: URL;
  try {
    url = new URL(options.url);
  } catch {
    // The text is not repeated: what failed to parse may still hold a user name and password.
    throw new ScenarioError('--url <unparsed URL> is not a URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ScenarioError(`--url must be http or https, not ${url.protocol}`);
  }
  // fetch() refuses such a URL, which would show up as a connection failure; the name and
  // password are not repeated in the message.
  if (url.username || url.password) {
    throw new ScenarioError(
      `--url must not hold a user name or password (user:password@host). Send them as a header: -H 'Authorization: Basic …'.`,
    );
  }
}

function base(name: string, options: RunOptions, clock: Clock, description?: string) {
  return {
    scenario: name,
    ...(description ? { description } : {}),
    ...(options.url && !options.dryRun ? { url: redactUrl(options.url) } : {}),
    clock,
    dryRun: options.dryRun ?? false,
    bundleId: options.workspace.app.bundleId,
    environment: options.workspace.app.environment,
  };
}

/** Plays every step of `scenario` against the webhook. */
export async function runScenario(scenario: Scenario, options: RunOptions): Promise<RunResult> {
  checkUrl(options);
  const start = options.start ?? (scenario.start ? new Date(scenario.start) : undefined);
  const clock = clockFor(options, start);
  const products = scenario.products ? normalizeProducts(scenario.products) : undefined;
  const seed = options.seed ?? scenario.seed;
  const sim = new Simulation({
    app: options.workspace.app,
    ...(products ? { products } : {}),
    ...(start ? { start } : {}),
    ...(seed ? { seed } : {}),
    ...(scenario.appAccountToken ? { appAccountToken: scenario.appAccountToken } : {}),
  });
  // Check URLs are checked before anything is sent.
  scenario.steps.forEach((step, index) => {
    if (step.check) checkTarget(step.check.url, index, options);
  });
  const steps: StepResult[] = [];
  await execute(
    sim,
    scenario.steps.map((step) => ({ step, send: true })),
    options,
    clock,
    steps,
  );
  return summarize(base(scenario.name, options, clock, scenario.description), steps);
}

export interface SendOptions extends RunOptions {
  /** The product of the event, from `products`. */
  product?: string;
  /** Products instead of asnsim's defaults. */
  products?: Product[];
  expect?: number | number[];
}

/** Sends one notification after playing, unsent, the history it needs. */
export async function sendNotification(
  type: string,
  subtype: string | null | undefined,
  options: SendOptions,
): Promise<RunResult> {
  checkUrl(options);
  const { event, steps: history } = standaloneSteps(type, subtype, {
    ...(options.product ? { product: options.product } : {}),
    ...(options.products ? { products: options.products } : {}),
  });
  const clock = clockFor(options, options.start);
  const sim = new Simulation({
    app: options.workspace.app,
    ...(options.products ? { products: options.products } : {}),
    ...(options.start ? { start: options.start } : {}),
    ...(options.seed ? { seed: options.seed } : {}),
  });
  const plan: PlanStep[] = history.map((step, index) => ({
    step:
      index === history.length - 1 && options.expect !== undefined
        ? { ...step, expect: { status: options.expect } }
        : step,
    send: index === history.length - 1,
  }));
  const steps: StepResult[] = [];
  await execute(sim, plan, options, clock, steps);
  return summarize(base(eventName(event.type, event.subtype), options, clock), steps);
}

/** Sends each of the catalog's events once, each after its own history. */
export async function sendAll(options: SendOptions): Promise<RunResult> {
  checkUrl(options);
  const clock = clockFor(options, options.start);
  const steps: StepResult[] = [];
  for (const entry of events()) {
    const { steps: history } = standaloneSteps(
      entry.type,
      entry.subtype,
      options.products ? { products: options.products } : {},
    );
    const sim = new Simulation({
      app: options.workspace.app,
      ...(options.products ? { products: options.products } : {}),
      ...(options.start ? { start: options.start } : {}),
      ...(options.seed ? { seed: `${options.seed}/${eventName(entry.type, entry.subtype)}` } : {}),
    });
    await execute(
      sim,
      history.map((step, index) => ({ step, send: index === history.length - 1 })),
      options,
      clock,
      steps,
    );
  }
  return summarize(base('every notification type', options, clock), steps);
}
