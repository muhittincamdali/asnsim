import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Access, eventName } from '../catalog.js';
import type { NotificationBody } from '../model.js';
import { redactBody } from '../redact/body.js';
import { redactLocation } from '../redact/url.js';
import type { ScenarioStep } from '../scenario/schema.js';
import { buildParts, signParts } from '../sim/payloads.js';
import type { Simulation } from '../sim/simulation.js';
import type { StepInput } from '../sim/step.js';
import { runCheck } from './check.js';
import { deliver, isAppleSuccess } from './deliver.js';
import { type Finding, finding } from './findings.js';
import type { Attempt, Clock, RunOptions, StepResult } from './result.js';

// One step of a run: sign the notification, POST it, compare the answer with what the App Store
// accepts (or what the step expects), resend it when asked, and run the step's check.

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
export type Delivered = Partial<Pick<ScenarioStep, 'expect' | 'check' | 'duplicate' | 'name'>>;

export interface PlanStep {
  step: StepInput & Delivered;
  /** False for the history of a standalone send: applied, not sent. */
  send: boolean;
}

export async function execute(
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
