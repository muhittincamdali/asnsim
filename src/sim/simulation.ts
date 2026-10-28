import { type CatalogEvent, eventName, findEvent } from '../catalog.js';
import type { AppSettings } from '../workspace.js';
import { addDuration } from './duration.js';
import { SimulationError } from './error.js';
import { DEFAULT_PRODUCTS, type Product } from './products.js';
import {
  changePlan,
  oneTimeCharge,
  renew,
  requireSubscription,
  type Shop,
  subscribe,
  transactionId,
} from './purchases.js';
import { createRandom, type Random } from './random.js';
import { refundEvent } from './refunds.js';
import type { CustomerState, Subscription, Transaction } from './state.js';
import { type Step, type StepInput, stepSchema } from './step.js';
import { DEFAULT_GRACE, eventTime } from './timeline.js';

// Plays a customer's purchase history one notification at a time. Each step moves a virtual clock
// to the time the event would happen (a renewal at the end of the period, a billing retry
// expiring 60 days after it started; timeline.ts) and changes the customer's state the way
// Apple's description of the notification says (purchases.ts, refunds.ts); payloads.ts then
// writes the JSON.

export { SimulationError };

export interface SimulationOptions {
  app: AppSettings;
  products?: Product[];
  /** Time of the first event. Default: now. */
  start?: Date;
  /** Seed for transaction IDs and notificationUUIDs; random when left out. */
  seed?: string;
  storefront?: { code: string; id: string };
  /** appAccountToken on every transaction, as an app sets it at purchase. */
  appAccountToken?: string;
}

/** One simulated event: the state it left and what its notification is about. */
export interface SimulatedEvent {
  /** Position in the scenario, from 1. */
  index: number;
  event: CatalogEvent;
  step: Step;
  at: Date;
  /** The transaction the notification carries, when it carries one. */
  transaction?: Transaction;
  /**
   * The subscription after the event, for signedRenewalInfo and status: present when the
   * transaction is the subscription's current one. A copy, so later steps do not change it.
   */
  subscription?: Subscription;
  consumptionRequestReason?: string;
  /** For RENEWAL_EXTENSION/SUMMARY. */
  summary?: { requestIdentifier: string; productId: string };
  /** For EXTERNAL_PURCHASE_TOKEN. */
  externalPurchaseToken?: { externalPurchaseId: string; custom: boolean };
  notificationUUID: string;
}

/** expirationIntent for each EXPIRED subtype; 5 (other) for the rest. */
const EXPIRATION_INTENT: Record<string, 1 | 2 | 3 | 4> = {
  VOLUNTARY: 1,
  BILLING_RETRY: 2,
  PRICE_INCREASE: 3,
  PRODUCT_NOT_FOR_SALE: 4,
};

export class Simulation implements Shop {
  readonly app: AppSettings;
  readonly products: Product[];
  readonly random: Random;
  readonly storefront: { code: string; id: string };
  readonly state: CustomerState;
  private clock: Date;
  private started = false;
  private count = 0;

  constructor(options: SimulationOptions) {
    this.app = options.app;
    this.products = options.products ?? DEFAULT_PRODUCTS;
    this.random = createRandom(options.seed);
    this.storefront = options.storefront ?? { code: 'USA', id: '143441' };
    this.clock = options.start ?? new Date();
    this.state = {
      purchases: [],
      appTransactionId: this.random.digits(18),
      ...(options.appAccountToken ? { appAccountToken: options.appAccountToken } : {}),
    };
  }

  /** The virtual time of the last event. */
  get now(): Date {
    return this.clock;
  }

  product(id: string): Product {
    const product = this.products.find((entry) => entry.id === id);
    if (!product) {
      throw new SimulationError(
        `Unknown product ${id}. Products: ${this.products.map((entry) => entry.id).join(', ')}.`,
      );
    }
    return product;
  }

  /** Applies one step and returns its event. */
  apply(input: StepInput): SimulatedEvent {
    const step = stepSchema.parse(input);
    const event = findEvent(step.type, step.subtype);
    this.count += 1;
    const at = eventTime(step, event, {
      clock: this.clock,
      started: this.started,
      subscription: this.state.subscription,
    });
    if (this.started && at.getTime() < this.clock.getTime()) {
      throw new SimulationError(
        `Step ${this.count} (${eventName(event.type, event.subtype)}) would happen at ${at.toISOString()}, before the previous step at ${this.clock.toISOString()}.`,
      );
    }
    this.clock = at;
    this.started = true;
    const result: SimulatedEvent = {
      index: this.count,
      event,
      step,
      at,
      notificationUUID: this.random.uuid(),
    };
    this.handle(step, event, result);
    // Copies: the payloads of this event must not change when later steps change the state.
    const { subscription, transaction } = result;
    if (subscription && transaction !== subscription.current) delete result.subscription;
    if (result.subscription) result.subscription = structuredClone(result.subscription);
    if (transaction) {
      result.transaction = result.subscription
        ? result.subscription.current
        : structuredClone(transaction);
    }
    return result;
  }

  private handle(step: Step, event: CatalogEvent, result: SimulatedEvent): void {
    const at = result.at;
    const attach = (subscription: Subscription) => {
      result.subscription = subscription;
      result.transaction = subscription.current;
      this.state.last = subscription.current;
    };
    switch (event.type) {
      case 'SUBSCRIBED':
        attach(subscribe(this, step, event, at));
        return;
      case 'DID_RENEW': {
        const subscription = requireSubscription(this.state, event);
        if (event.subtype === 'BILLING_RECOVERY' && !subscription.retrySince) {
          throw new SimulationError(
            'DID_RENEW/BILLING_RECOVERY follows a failed renewal: add DID_FAIL_TO_RENEW first.',
          );
        }
        renew(this.random, subscription, at);
        attach(subscription);
        return;
      }
      case 'DID_FAIL_TO_RENEW': {
        const subscription = requireSubscription(this.state, event);
        subscription.retrySince = at;
        subscription.expirationIntent = 2;
        delete subscription.gracePeriodExpires;
        if (event.subtype === 'GRACE_PERIOD') {
          subscription.gracePeriodExpires = addDuration(
            subscription.current.expiresDate ?? at,
            step.gracePeriod ?? DEFAULT_GRACE,
          );
        }
        attach(subscription);
        return;
      }
      case 'GRACE_PERIOD_EXPIRED': {
        const subscription = requireSubscription(this.state, event);
        if (!subscription.gracePeriodExpires) {
          throw new SimulationError('GRACE_PERIOD_EXPIRED follows DID_FAIL_TO_RENEW/GRACE_PERIOD.');
        }
        delete subscription.gracePeriodExpires;
        attach(subscription);
        return;
      }
      case 'EXPIRED': {
        const subscription = requireSubscription(this.state, event);
        subscription.expired = true;
        subscription.expirationIntent = EXPIRATION_INTENT[event.subtype ?? ''] ?? 5;
        delete subscription.retrySince;
        delete subscription.gracePeriodExpires;
        attach(subscription);
        return;
      }
      case 'DID_CHANGE_RENEWAL_STATUS': {
        const subscription = requireSubscription(this.state, event);
        subscription.autoRenewStatus = event.subtype === 'AUTO_RENEW_ENABLED' ? 1 : 0;
        attach(subscription);
        return;
      }
      case 'DID_CHANGE_RENEWAL_PREF':
      case 'OFFER_REDEEMED':
        attach(changePlan(this, step, event, at));
        return;
      case 'PRICE_INCREASE': {
        const subscription = requireSubscription(this.state, event);
        const price =
          step.price ??
          subscription.priceIncrease?.price ??
          Math.round(subscription.product.price * 120) / 100;
        subscription.priceIncrease = { status: event.subtype === 'ACCEPTED' ? 1 : 0, price };
        attach(subscription);
        return;
      }
      case 'REFUND':
      case 'REFUND_DECLINED':
      case 'REFUND_REVERSED':
      case 'CONSUMPTION_REQUEST':
      case 'REVOKE':
        refundEvent(this, step, event, result);
        return;
      case 'RENEWAL_EXTENDED': {
        const subscription = requireSubscription(this.state, event);
        const expires = subscription.current.expiresDate ?? at;
        subscription.current.expiresDate = addDuration(expires, step.extendBy ?? 'P7D');
        attach(subscription);
        return;
      }
      case 'RENEWAL_EXTENSION': {
        const subscription = requireSubscription(this.state, event);
        if (event.subtype === 'SUMMARY') {
          result.summary = {
            requestIdentifier: this.random.uuid(),
            productId: subscription.product.id,
          };
          return;
        }
        attach(subscription);
        return;
      }
      case 'ONE_TIME_CHARGE':
        result.transaction = oneTimeCharge(this, step, at);
        return;
      case 'EXTERNAL_PURCHASE_TOKEN':
        result.externalPurchaseToken = {
          externalPurchaseId: `${this.app.environment === 'Sandbox' ? 'SANDBOX_' : ''}${this.random.uuid()}`,
          custom: event.subtype !== 'UNREPORTED',
        };
        return;
      case 'METADATA_UPDATE':
      case 'MIGRATION':
      case 'PRICE_CHANGE': {
        const subscription = requireSubscription(this.state, event);
        if (event.type === 'PRICE_CHANGE' && step.price !== undefined) {
          subscription.priceIncrease = { status: 1, price: step.price };
        }
        if (event.type === 'MIGRATION') {
          subscription.current.previousOriginalTransactionId ??= transactionId(this.random);
        }
        attach(subscription);
        return;
      }
      default:
        // TEST and RESCIND_CONSENT carry no purchase.
        return;
    }
  }
}
