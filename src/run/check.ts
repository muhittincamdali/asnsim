import { redactAnswer, redactJson } from '../redact/body.js';
import { REDACTED } from '../redact/names.js';
import { redactUrl } from '../redact/url.js';
import { ScenarioError } from '../scenario/load.js';
import type { Check } from '../scenario/schema.js';
import { request } from './deliver.js';
import type { CheckResult, RunOptions } from './result.js';

// A step's check: a request to the backend after the notification, on the webhook's own origin,
// whose answer is compared with what the step expects.

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
export function checkTarget(template: string, index: number, options: RunOptions): void {
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

export async function runCheck(
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
    ...(answer.answer === undefined ? {} : { body: redactAnswer(answer.answer).slice(0, 2000) }),
    ...(answer.error === undefined ? {} : { error: answer.error }),
    ms: answer.ms,
    mismatches,
  };
}
