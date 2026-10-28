import type { NotificationBody } from '../model.js';
import type { Answer } from '../redact/body.js';
import { VERSION } from '../version.js';

// One HTTP request the way the App Store sends a notification: a POST with the JSON body
// { "signedPayload": "…" }. Redirects are not followed, since the App Store counts a 3xx as a
// failed delivery. Only the first 64 KB of the answer is kept, with its content type, for the
// checks and the report.

export interface Delivery {
  /** HTTP status, when the server answered. */
  status?: number;
  /** Response body, cut to 64 KB and read as UTF-8, for the checks. Never shown as it is. */
  body?: string;
  /** The answer as the report reads it: src/redact/body.ts redacts it into Attempt.body. */
  answer?: Answer;
  /** Location header of a redirect. */
  location?: string;
  /** Network error or timeout, when the server did not answer. */
  error?: string;
  timedOut?: boolean;
  /** Time from sending to the end of the answer, in milliseconds. */
  ms: number;
}

export type Fetch = typeof fetch;

/** The bytes of an answer kept for the checks and the report. */
export const MAX_BODY = 65_536;

async function readAnswer(response: Response): Promise<Answer> {
  const contentType = response.headers.get('content-type');
  if (!response.body) return { bytes: new Uint8Array(), contentType, cut: false };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  // Reading on past the limit tells a body of exactly 64 KB from a longer one.
  while (size <= MAX_BODY) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => undefined);
  const bytes = Buffer.concat(chunks).subarray(0, MAX_BODY);
  return { bytes, contentType, cut: size > MAX_BODY };
}

/** A response body as asnsim keeps it: its first 64 KB, read as UTF-8. */
export const bodyText = (bytes: Uint8Array) =>
  Buffer.from(bytes).subarray(0, MAX_BODY).toString('utf8');

interface Cause {
  code?: string;
  message?: string;
  errors?: Cause[];
}

/** The network error under fetch's "fetch failed": ECONNREFUSED, ENOTFOUND, … */
function describe(error: unknown): string {
  const cause = (error as { cause?: Cause }).cause;
  const inner = cause?.code ? cause : cause?.errors?.find((entry) => entry.code);
  if (inner?.code) return `${inner.code}${inner.message ? `: ${inner.message}` : ''}`;
  return [(error as Error).message, cause?.message].filter(Boolean).join(': ');
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
  timeoutMs: number;
  fetch?: Fetch;
}

/** Sends one request and records what came back; never throws for network errors. */
export async function request(url: string, options: RequestOptions): Promise<Delivery> {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  try {
    const response = await (options.fetch ?? fetch)(url, {
      method: options.method ?? 'GET',
      headers: {
        'user-agent': `asnsim/${VERSION}`,
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...options.headers,
      },
      ...(options.body === undefined ? {} : { body: options.body }),
      redirect: 'manual',
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    const answer = await readAnswer(response);
    const location = response.headers.get('location');
    return {
      status: response.status,
      body: bodyText(answer.bytes),
      answer,
      ...(location ? { location } : {}),
      ms: ms(),
    };
  } catch (error) {
    const name = (error as Error).name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      return { error: `no answer within ${options.timeoutMs} ms`, timedOut: true, ms: ms() };
    }
    return { error: describe(error), ms: ms() };
  }
}

/** POSTs a notification body to the webhook. */
export function deliver(
  url: string,
  body: NotificationBody,
  options: Omit<RequestOptions, 'method' | 'body'>,
): Promise<Delivery> {
  return request(url, { ...options, method: 'POST', body: JSON.stringify(body) });
}

/** HTTP 200 to 206: what the App Store counts as a successful delivery. */
export const isAppleSuccess = (status: number | undefined) =>
  status !== undefined && status >= 200 && status <= 206;
