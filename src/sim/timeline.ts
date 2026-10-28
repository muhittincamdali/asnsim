import type { CatalogEvent } from '../catalog.js';
import { addDuration } from './duration.js';
import type { Subscription } from './state.js';
import type { Step } from './step.js';

const DAY = 'P1D';
export const DEFAULT_GRACE = 'P16D';
const BILLING_RETRY = 'P60D';

/** Where the virtual clock stands before a step. */
export interface ClockState {
  clock: Date;
  /** False until the first step: that one happens at the start. */
  started: boolean;
  subscription?: Subscription | undefined;
}

/** When the event happens: `at`, `after` the previous step, or the event's own moment. */
export function eventTime(step: Step, event: CatalogEvent, now: ClockState): Date {
  const { clock, started, subscription } = now;
  if (step.at) return new Date(step.at);
  if (!started) return clock;
  if (step.after) return addDuration(clock, step.after);
  const expires = subscription?.current.expiresDate;
  const atLeastNow = (date: Date | undefined) =>
    date && date.getTime() > clock.getTime() ? date : clock;
  switch (event.type) {
    case 'DID_RENEW':
      if (event.subtype === 'BILLING_RECOVERY') return addDuration(clock, DAY);
      return atLeastNow(expires);
    case 'DID_FAIL_TO_RENEW':
      return atLeastNow(expires);
    case 'GRACE_PERIOD_EXPIRED':
      return atLeastNow(subscription?.gracePeriodExpires);
    case 'EXPIRED':
      if (event.subtype === 'BILLING_RETRY' && subscription?.retrySince) {
        return atLeastNow(addDuration(subscription.retrySince, BILLING_RETRY));
      }
      return atLeastNow(expires);
    case 'SUBSCRIBED':
      return addDuration(clock, event.subtype === 'RESUBSCRIBE' ? 'P7D' : DAY);
    default:
      return addDuration(clock, DAY);
  }
}
