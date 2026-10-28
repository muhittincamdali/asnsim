import type { Access } from '../catalog.js';
import type { Workspace } from '../workspace.js';
import type { Delivery, Fetch } from './deliver.js';
import type { Finding } from './findings.js';

// What a run takes and what it returns: the options of runScenario(), sendNotification() and
// sendAll(), and the result the reports render.

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
export interface Attempt extends Omit<Delivery, 'answer'> {
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
