import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Access, eventName, events } from '../catalog.js';
import type { NotificationBody } from '../model.js';
import { ScenarioError } from '../scenario/load.js';
import type { Check, Scenario, ScenarioStep } from '../scenario/schema.js';
import { redactBody, redactJson } from '../redact/body.js';
import { REDACTED } from '../redact/names.js';
import { redactLocation, redactUrl } from '../redact/url.js';
import { buildParts, signParts } from '../sim/payloads.js';
import { normalizeProducts, type Product } from '../sim/products.js';
import { Simulation } from '../sim/simulation.js';
import { standaloneSteps } from '../sim/standalone.js';
import type { StepInput } from '../sim/step.js';
import type { Workspace } from '../workspace.js';
import { type Delivery, deliver, type Fetch, isAppleSuccess, request } from './deliver.js';
import { type Finding, finding } from './findings.js';

// Plays a scenario against a webhook: for each step, sign the notification, POST it, compare the
// answer with what the App Store accepts (or what the step expects), resend it when asked, and
// run the step's check against the backend.

export type Clock = 'live' | 'fixed';

export interface RunOptions {
  workspace: Workspace;
  /** Webhook URL. Not needed with dryRun. */
  url?: string;
  /**
   * live: each notification is dated when it is sent, the scenario's gaps kept between the dates
   * inside it. fixed: the dates are the scenario's own, from its start. Default: fixed when the
   * scenario or `start` gives a start, live otherwise.
   */
  clock?: Clock;
  start?: Date;
  seed?: string;
  /** Resend a failed notification up to this many times (the App Store retries 5 times). */
  retries?: number;
  /** Send every notification twice. */
  duplicate?: boolean;
  timeoutMs?: number;
  headers?: Record<string, string>;
  /** Write each request body to this folder as NN-TYPE.SUBTYPE.json. */
  outDir?: string;
  /** Sign and write, but send nothing. */
  dryRun?: boolean;
  fetch?: Fetch;
  now?: () => Date;
  onStep?: (step: StepResult) => void;
}

/** One delivery as the report shows it: `body` and `location` redacted (see src/redact). */
export interface Attempt extends Delivery {
  /** 1 for the first send; retries and duplicates count on. */
  attempt: number;
  kind: 'send' | 'retry' | 'duplicate';
}

export interface CheckResult {
  /** The URL with its query values and IDs hidden, as the report shows it. */
  url: string;
  method: 'GET' | 'POST';
  ok: boolean;
  expectedStatus: number;
  status?: number;
  /** The answer redacted, then cut to 2,000 characters. */
  body?: string;
  error?: string;
  ms: number;
  /** What did not match, one line each. */
  mismatches: string[];
}

export interface StepResult {
  index: number;
  name: string;
  type: string;
  subtype: string | null;
  access: Access;
  /** When the event happens in the scenario's timeline. */
  at: string;
  signedDate: string;
  notificationUUID: string;
  transactionId?: string;
  originalTransactionId?: string;
  productId?: string;
  attempts: Attempt[];
  check?: CheckResult;
  findings: Finding[];
  ok: boolean;
  /** Where the body was written, with outDir. */
  file?: string;
}

export interface RunResult {
  scenario: string;
  description?: string;
  /** The webhook URL without user name, password and fragment, its query values hidden. */
  url?: string;
  clock: Clock;
  dryRun: boolean;
  bundleId: string;
  environment: string;
  steps: StepResult[];
  ok: boolean;
  counts: { steps: number; passed: number; failed: number; requests: number };
}

const PLACEHOLDERS = [
  'originalTransactionId',
  'transactionId',
  'productId',
  'notificationUUID',
  'appAccountToken',
  'bundleId',
] as const;

/** The part of `shown` (the redacted answer) at `key`, where `actual` holds `value`. */
function shownAt(shown: unknown, key: string | number, value: unknown): unknown {
  if (value === undefined) return undefined;
  if (typeof shown !== 'object' || shown === null || !Object.hasOwn(shown, key)) return REDACTED;
  return (shown as Record<string, unknown>)[key];
}

/**
 * Every key and value of `expected` is in `actual`; arrays must match element by element. The
 * messages show `actual` as a report may: `shown` is `actual` redacted (see src/redact), so a
 * value hidden there is hidden in the message too.
 */
export function containsJson(
  expected: unknown,
  actual: unknown,
  path = '$',
  shown: unknown = redactJson(actual),
): string[] {
  const got = JSON.stringify(shown) ?? 'undefined';
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return [`${path}: expected ${JSON.stringify(expected)}, got ${got}`];
    }
    return expected.flatMap((item, index) =>
      containsJson(item, actual[index], `${path}[${index}]`, shownAt(shown, index, actual[index])),
    );
  }
  if (typeof expected === 'object' && expected !== null) {
    if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
      return [`${path}: expected an object, got ${got}`];
    }
    return Object.entries(expected).flatMap(([key, value]) => {
      const entry = (actual as Record<string, unknown>)[key];
      return containsJson(value, entry, `${path}.${key}`, shownAt(shown, key, entry));
    });
  }
  return Object.is(expected, actual)
    ? []
    : [`${path}: expected ${JSON.stringify(expected)}, got ${got}`];
}

function checkPlaceholders(template: string, index: number): void {
  for (const [match, name] of template.matchAll(/\{([A-Za-z]+)\}/g)) {
    if (!(PLACEHOLDERS as readonly string[]).includes(name ?? '')) {
      throw new ScenarioError(
        `steps[${index}].check.url: unknown placeholder ${match}. Placeholders: ${PLACEHOLDERS.map((entry) => `{${entry}}`).join(', ')}.`,
      );
    }
  }
}

/** A path on the webhook's origin: one `/`, not followed by a second `/` or a backslash. */
const CHECK_PATH = /^\/(?![/\\])/;

/**
 * A check may only go to the webhook's own origin (scheme, host and port). A scenario file can
 * come from someone else; without this rule it could make asnsim request any host, with the
 * --header values meant for the webhook. This is the early test, before anything is sent; the
 * filled-in URL is tested again in runCheck(), since a placeholder's value is only known then.
 */
function checkTarget(template: string, index: number, options: RunOptions): void {
  checkPlaceholders(template, index);
  if (options.dryRun || !options.url) {
    checkPath(template, index);
    return;
  }
  const webhook = new URL(options.url);
  let target: URL;
  try {
    target = new URL(template.replace(/\{[A-Za-z]+\}/g, 'x'), webhook);
  } catch {
    throw new ScenarioError(`steps[${index}].check.url: ${template} is not a URL.`);
  }
  if (target.origin !== webhook.origin) {
    throw new ScenarioError(
      `steps[${index}].check.url: a check goes to the webhook's origin, ${webhook.origin}; ${target.protocol === 'http:' || target.protocol === 'https:' ? target.origin : target.protocol} is another. Use a path such as /entitlements/{originalTransactionId}.`,
    );
  }
  checkPath(template, index);
}

function checkPath(template: string, index: number): void {
  if (!CHECK_PATH.test(template)) {
    throw new ScenarioError(
      `steps[${index}].check.url: ${template} does not start with a single /. A check is a path on the webhook's origin, such as /entitlements/{originalTransactionId}.`,
    );
  }
}

function fillTemplate(template: string, values: Record<string, string | undefined>, index: number) {
  checkPlaceholders(template, index);
  return template.replace(/\{([A-Za-z]+)\}/g, (_match, name: string) => {
    const value = values[name];
    if (value === undefined) {
      throw new ScenarioError(`steps[${index}].check.url: this step has no ${name}.`);
    }
    return encodeURIComponent(value);
  });
}

async function runCheck(
  check: Check,
  base: string,
  values: Record<string, string | undefined>,
  index: number,
  options: RunOptions,
): Promise<CheckResult> {
  // checkTarget() tested the template; a value can still change where the filled-in URL goes
  // (an empty one turns "/{originalTransactionId}/x" into "//x", another host), so the final URL
  // is tested before anything, the --header values included, is sent to it.
  const webhook = new URL(base);
  const target = new URL(fillTemplate(check.url, values, index), webhook);
  if (target.origin !== webhook.origin) {
    throw new ScenarioError(
      `steps[${index}].check.url: filled in, ${check.url} goes to ${target.protocol === 'http:' || target.protocol === 'https:' ? target.origin : target.protocol}, not the webhook's origin ${webhook.origin}; the check was not sent.`,
    );
  }
  const url = target.toString();
  const answer = await request(url, {
    method: check.method,
    timeoutMs: options.timeoutMs ?? 10_000,
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  const mismatches: string[] = [];
  if (answer.status !== undefined && answer.status !== check.status) {
    mismatches.push(`status: expected ${check.status}, got ${answer.status}`);
  }
  if (answer.status !== undefined && check.json !== undefined) {
    try {
      mismatches.push(...containsJson(check.json, JSON.parse(answer.body ?? '')));
    } catch {
      mismatches.push('body: expected JSON');
    }
  }
  if (answer.status !== undefined && check.contains !== undefined) {
    if (!(answer.body ?? '').includes(check.contains)) {
      mismatches.push(`body: does not contain ${JSON.stringify(check.contains)}`);
    }
  }
  return {
    url: redactUrl(url),
    method: check.method,
    ok: answer.status !== undefined && mismatches.length === 0,
    expectedStatus: check.status,
    ...(answer.status === undefined ? {} : { status: answer.status }),
    ...(answer.body === undefined ? {} : { body: redactBody(answer.body).slice(0, 2000) }),
    ...(answer.error === undefined ? {} : { error: answer.error }),
    ms: answer.ms,
    mismatches,
  };
}

function statusFinding(attempt: Attempt, expected?: number | number[]): Finding | undefined {
  if (attempt.status === undefined) {
    return attempt.timedOut
      ? finding('timeout', `No answer within the time limit (${attempt.error}).`)
      : finding('connection-failed', `Nothing answered: ${attempt.error}.`);
  }
  if (expected !== undefined) {
    const allowed = Array.isArray(expected) ? expected : [expected];
    return allowed.includes(attempt.status)
      ? undefined
      : finding(
          'unexpected-status',
          `The webhook answered ${attempt.status}; the step expects ${allowed.join(' or ')}.`,
        );
  }
  if (isAppleSuccess(attempt.status)) return undefined;
  if (attempt.status >= 300 && attempt.status < 400) {
    return finding(
      'redirect',
      `The webhook answered ${attempt.status}${attempt.location ? ` to ${attempt.location}` : ''}: the App Store would count the delivery as failed.`,
    );
  }
  return finding(
    'rejected',
    `The webhook answered ${attempt.status}: the App Store would count the delivery as failed.`,
  );
}

const accessHint: Record<Access, string> = {
  grant: 'Apple describes this notification as giving the customer access.',
  keep: 'Apple asks that access continue during Billing Grace Period.',
  end: 'Apple says the subscription ended and the service can stop.',
  revoke: 'The App Store refunded or revoked the purchase.',
  reinstate: 'Apple asks that what the refund removed be reinstated.',
  unchanged: 'This notification does not change access by itself.',
};

/** What a step adds to the notification: expectations, a check, a duplicate send, a name. */
type Delivered = Partial<Pick<ScenarioStep, 'expect' | 'check' | 'duplicate' | 'name'>>;

interface PlanStep {
  step: StepInput & Delivered;
  /** False for the history of a standalone send: applied, not sent. */
  send: boolean;
}

async function execute(
  sim: Simulation,
  plan: PlanStep[],
  options: RunOptions,
  clock: Clock,
  results: StepResult[],
): Promise<void> {
  const now = options.now ?? (() => new Date());
  for (const { step, send } of plan) {
    const event = sim.apply(step);
    if (!send) continue;
    const shift = clock === 'live' ? now().getTime() - event.at.getTime() : 0;
    const signed = signParts(buildParts(sim, event, shift), options.workspace.chain);
    const body: NotificationBody = { signedPayload: signed.signedPayload };
    const index = results.length + 1;
    const name = step.name ?? eventName(event.event.type, event.event.subtype);
    const values = {
      originalTransactionId: signed.transaction?.originalTransactionId,
      transactionId: signed.transaction?.transactionId,
      productId: signed.transaction?.productId,
      notificationUUID: event.notificationUUID,
      appAccountToken: sim.state.appAccountToken,
      bundleId: sim.app.bundleId,
    };
    const result: StepResult = {
      index,
      name,
      type: event.event.type,
      subtype: event.event.subtype,
      access: event.event.access,
      at: event.at.toISOString(),
      signedDate: new Date(signed.notification.signedDate).toISOString(),
      notificationUUID: event.notificationUUID,
      ...(values.transactionId ? { transactionId: values.transactionId } : {}),
      ...(values.originalTransactionId
        ? { originalTransactionId: values.originalTransactionId }
        : {}),
      ...(values.productId ? { productId: values.productId } : {}),
      attempts: [],
      findings: [],
      ok: true,
    };
    if (options.outDir) {
      mkdirSync(options.outDir, { recursive: true });
      const file = join(
        options.outDir,
        `${String(index).padStart(2, '0')}-${eventName(event.event.type, event.event.subtype).replace('/', '.')}.json`,
      );
      writeFileSync(file, `${JSON.stringify(body)}\n`);
      result.file = file;
    }
    if (!options.dryRun && options.url) {
      await sendStep(options.url, body, step, result, options);
      if (step.check && result.findings.length === 0) {
        result.check = await runCheck(step.check, options.url, values, index - 1, options);
        if (!result.check.ok) {
          result.findings.push(
            result.check.status === undefined
              ? finding(
                  'check-unreachable',
                  `The check ${result.check.url} did not answer: ${result.check.error}.`,
                )
              : finding(
                  'check-failed',
                  `The check ${result.check.method} ${result.check.url} did not match: ${result.check.mismatches.join('; ')}.`,
                  [`${name}: ${accessHint[event.event.access]}`],
                ),
          );
        }
      }
    }
    result.ok = result.findings.length === 0;
    results.push(result);
    options.onStep?.(result);
  }
}

async function sendStep(
  url: string,
  body: NotificationBody,
  step: Delivered,
  result: StepResult,
  options: RunOptions,
): Promise<void> {
  const send = async (kind: Attempt['kind']) => {
    const delivery = await deliver(url, body, {
      timeoutMs: options.timeoutMs ?? 10_000,
      ...(options.headers ? { headers: options.headers } : {}),
      ...(options.fetch ? { fetch: options.fetch } : {}),
    });
    // The answer is kept as the report shows it: the body and Location header redacted.
    const attempt: Attempt = {
      ...delivery,
      ...(delivery.body === undefined ? {} : { body: redactBody(delivery.body) }),
      ...(delivery.location === undefined
        ? {}
        : { location: redactLocation(delivery.location, url) }),
      attempt: result.attempts.length + 1,
      kind,
    };
    result.attempts.push(attempt);
    return attempt;
  };
  let attempt = await send('send');
  let problem = statusFinding(attempt, step.expect?.status);
  const retries = Math.min(Math.max(options.retries ?? 0, 0), 5);
  for (let retry = 0; problem && retry < retries; retry++) {
    attempt = await send('retry');
    problem = statusFinding(attempt, step.expect?.status);
  }
  if (problem) {
    result.findings.push(
      retries > 0 && problem.code === 'rejected'
        ? {
            ...problem,
            message: `${problem.message} ${retries} retr${retries === 1 ? 'y' : 'ies'} failed too.`,
          }
        : problem,
    );
    return;
  }
  if (step.duplicate || options.duplicate) {
    const first = attempt;
    const again = await send('duplicate');
    const duplicateProblem = statusFinding(again, step.expect?.status);
    if (duplicateProblem || again.status !== first.status) {
      result.findings.push(
        finding(
          'duplicate-differs',
          `The same notification (notificationUUID ${result.notificationUUID}) sent again got ${again.status ?? again.error}, the first time ${first.status}.`,
        ),
      );
    }
  }
}

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
