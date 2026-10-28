import { type CatalogEvent, eventName, findEvent } from '../catalog.js';
import type { AppSettings } from '../workspace.js';
import { addDuration } from './duration.js';
import { DEFAULT_PRODUCTS, type Product } from './products.js';
import { createRandom, type Random } from './random.js';
import type { CustomerState, Offer, Ownership, Subscription, Transaction } from './state.js';
import { type Step, type StepInput, stepSchema } from './step.js';

// Plays a customer's purchase history one notification at a time. Each step moves a virtual clock
// to the time the event would happen (a renewal at the end of the period, a billing retry
// expiring 60 days after it started) and changes the customer's state the way Apple's
// description of the notification says; payloads.ts then writes the JSON.

export class SimulationError extends Error {
  override name = 'SimulationError';
}

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

const DAY = 'P1D';
const DEFAULT_GRACE = 'P16D';
const BILLING_RETRY = 'P60D';

/** Apple's offerType values. */
const OFFER_TYPE = { introductory: 1, promotional: 2, 'offer-code': 3, 'win-back': 4 } as const;

export class Simulation {
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

  private firstOfType(type: Product['type']): Product {
    const product = this.products.find((entry) => entry.type === type);
    if (!product) throw new SimulationError(`The scenario declares no ${type} product.`);
    return product;
  }

  private transactionId(): string {
    return `2${this.random.digits(15)}`;
  }

  private subscription(event: CatalogEvent): Subscription {
    const subscription = this.state.subscription;
    if (!subscription) {
      throw new SimulationError(
        `${eventName(event.type, event.subtype)} needs a subscription: start the scenario with SUBSCRIBED.`,
      );
    }
    return subscription;
  }

  /** Applies one step and returns its event. */
  apply(input: StepInput): SimulatedEvent {
    const step = stepSchema.parse(input);
    const event = findEvent(step.type, step.subtype);
    this.count += 1;
    const at = this.timeOf(step, event);
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

  /** When the event happens: `at`, `after` the previous step, or the event's own moment. */
  private timeOf(step: Step, event: CatalogEvent): Date {
    if (step.at) return new Date(step.at);
    if (!this.started) return this.clock;
    if (step.after) return addDuration(this.clock, step.after);
    const subscription = this.state.subscription;
    const expires = subscription?.current.expiresDate;
    const atLeastNow = (date: Date | undefined) =>
      date && date.getTime() > this.clock.getTime() ? date : this.clock;
    switch (event.type) {
      case 'DID_RENEW':
        if (event.subtype === 'BILLING_RECOVERY') return addDuration(this.clock, DAY);
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
        return addDuration(this.clock, event.subtype === 'RESUBSCRIBE' ? 'P7D' : DAY);
      default:
        return addDuration(this.clock, DAY);
    }
  }

  private offer(step: Step, product: Product, fallbackType: keyof typeof OFFER_TYPE): Offer {
    const input = step.offer ?? { type: fallbackType };
    const type = OFFER_TYPE[input.type ?? fallbackType];
    const discount = input.discount ?? (type === 1 ? 'FREE_TRIAL' : 'PAY_AS_YOU_GO');
    const offer: Offer = {
      type,
      discount,
      period: input.period ?? (discount === 'FREE_TRIAL' ? 'P1W' : (product.period ?? 'P1M')),
      price: input.price ?? (discount === 'FREE_TRIAL' ? 0 : Math.round(product.price * 50) / 100),
    };
    if (type !== 1) offer.identifier = input.id ?? `${input.type ?? fallbackType}-offer`;
    return offer;
  }

  private newTransaction(
    product: Product,
    at: Date,
    reason: Transaction['reason'],
    extra: Partial<Transaction> = {},
  ): Transaction {
    const id = this.transactionId();
    return {
      transactionId: id,
      originalTransactionId: id,
      product,
      purchaseDate: at,
      originalPurchaseDate: at,
      reason,
      price: product.price,
      quantity: 1,
      ownership: 'PURCHASED',
      ...extra,
    };
  }

  /** A new period of the subscription, starting at `at`, charged `price` unless an offer applies. */
  private period(
    subscription: Subscription,
    product: Product,
    at: Date,
    reason: Transaction['reason'],
    price: number,
    offer?: Offer,
  ): Transaction {
    const length = offer && offer.discount !== 'PAY_AS_YOU_GO' ? offer.period : product.period;
    const transaction = this.newTransaction(product, at, reason, {
      originalTransactionId: subscription.originalTransactionId,
      originalPurchaseDate: subscription.originalPurchaseDate,
      webOrderLineItemId: `2${this.random.digits(15)}`,
      expiresDate: addDuration(at, length ?? 'P1M'),
      price: offer ? offer.price : price,
      quantity: subscription.current.quantity,
      ownership: subscription.current.ownership,
    });
    if (offer) transaction.offer = offer;
    return transaction;
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
        attach(this.subscribe(step, event, at));
        return;
      case 'DID_RENEW': {
        const subscription = this.subscription(event);
        if (event.subtype === 'BILLING_RECOVERY' && !subscription.retrySince) {
          throw new SimulationError(
            'DID_RENEW/BILLING_RECOVERY follows a failed renewal: add DID_FAIL_TO_RENEW first.',
          );
        }
        this.renew(subscription, at);
        attach(subscription);
        return;
      }
      case 'DID_FAIL_TO_RENEW': {
        const subscription = this.subscription(event);
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
        const subscription = this.subscription(event);
        if (!subscription.gracePeriodExpires) {
          throw new SimulationError('GRACE_PERIOD_EXPIRED follows DID_FAIL_TO_RENEW/GRACE_PERIOD.');
        }
        delete subscription.gracePeriodExpires;
        attach(subscription);
        return;
      }
      case 'EXPIRED': {
        const subscription = this.subscription(event);
        const intents: Record<string, 1 | 2 | 3 | 4> = {
          VOLUNTARY: 1,
          BILLING_RETRY: 2,
          PRICE_INCREASE: 3,
          PRODUCT_NOT_FOR_SALE: 4,
        };
        subscription.expired = true;
        subscription.expirationIntent = intents[event.subtype ?? ''] ?? 5;
        delete subscription.retrySince;
        delete subscription.gracePeriodExpires;
        attach(subscription);
        return;
      }
      case 'DID_CHANGE_RENEWAL_STATUS': {
        const subscription = this.subscription(event);
        subscription.autoRenewStatus = event.subtype === 'AUTO_RENEW_ENABLED' ? 1 : 0;
        attach(subscription);
        return;
      }
      case 'DID_CHANGE_RENEWAL_PREF':
      case 'OFFER_REDEEMED':
        attach(this.changePlan(step, event, at));
        return;
      case 'PRICE_INCREASE': {
        const subscription = this.subscription(event);
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
        this.refundEvent(step, event, result);
        return;
      case 'RENEWAL_EXTENDED': {
        const subscription = this.subscription(event);
        const expires = subscription.current.expiresDate ?? at;
        subscription.current.expiresDate = addDuration(expires, step.extendBy ?? 'P7D');
        attach(subscription);
        return;
      }
      case 'RENEWAL_EXTENSION': {
        const subscription = this.subscription(event);
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
      case 'ONE_TIME_CHARGE': {
        const product = step.product ? this.product(step.product) : this.firstOfType('consumable');
        if (product.type === 'auto-renewable') {
          throw new SimulationError(
            `ONE_TIME_CHARGE is for consumables, non-consumables and non-renewing subscriptions; ${product.id} is auto-renewable (use SUBSCRIBED).`,
          );
        }
        const transaction = this.newTransaction(product, at, 'PURCHASE', {
          quantity: step.quantity ?? 1,
          ownership: (step.ownership ?? 'PURCHASED') as Ownership,
          price: product.price,
        });
        if (step.offer)
          transaction.offer = { ...this.offer(step, product, 'offer-code'), discount: 'ONE_TIME' };
        this.state.purchases.push(transaction);
        this.state.last = transaction;
        result.transaction = transaction;
        return;
      }
      case 'EXTERNAL_PURCHASE_TOKEN':
        result.externalPurchaseToken = {
          externalPurchaseId: `${this.app.environment === 'Sandbox' ? 'SANDBOX_' : ''}${this.random.uuid()}`,
          custom: event.subtype !== 'UNREPORTED',
        };
        return;
      case 'METADATA_UPDATE':
      case 'MIGRATION':
      case 'PRICE_CHANGE': {
        const subscription = this.subscription(event);
        if (event.type === 'PRICE_CHANGE' && step.price !== undefined) {
          subscription.priceIncrease = { status: 1, price: step.price };
        }
        if (event.type === 'MIGRATION') {
          subscription.current.previousOriginalTransactionId ??= this.transactionId();
        }
        attach(subscription);
        return;
      }
      default:
        // TEST and RESCIND_CONSENT carry no purchase.
        return;
    }
  }

  private subscribe(step: Step, event: CatalogEvent, at: Date): Subscription {
    const product = step.product ? this.product(step.product) : this.firstOfType('auto-renewable');
    if (product.type !== 'auto-renewable') {
      throw new SimulationError(
        `SUBSCRIBED is for auto-renewable subscriptions; ${product.id} is ${product.type} (use ONE_TIME_CHARGE).`,
      );
    }
    const existing = this.state.subscription;
    if (event.subtype === 'RESUBSCRIBE') {
      if (!existing) {
        throw new SimulationError(
          'SUBSCRIBED/RESUBSCRIBE needs an earlier subscription in the group.',
        );
      }
      // recentSubscriptionStartDate ignores lapses of paid service of 60 days or fewer.
      const lapse = at.getTime() - (existing.current.expiresDate ?? at).getTime();
      if (lapse > 60 * 86_400_000) existing.recentStart = at;
      const offer = step.offer ? this.offer(step, product, 'win-back') : undefined;
      existing.product = product;
      existing.autoRenewProduct = product;
      existing.price = product.price;
      existing.current = this.period(existing, product, at, 'PURCHASE', product.price, offer);
      existing.expired = false;
      existing.autoRenewStatus = 1;
      delete existing.expirationIntent;
      delete existing.retrySince;
      delete existing.gracePeriodExpires;
      delete existing.priceIncrease;
      return existing;
    }
    const offer = step.offer ? this.offer(step, product, 'introductory') : undefined;
    const first = this.newTransaction(product, at, 'PURCHASE', {
      quantity: step.quantity ?? 1,
      ownership: (step.ownership ?? 'PURCHASED') as Ownership,
    });
    const subscription: Subscription = {
      product,
      autoRenewProduct: product,
      originalTransactionId: first.transactionId,
      originalPurchaseDate: at,
      recentStart: at,
      current: first,
      autoRenewStatus: 1,
      expired: false,
      price: product.price,
    };
    subscription.current = {
      ...this.period(subscription, product, at, 'PURCHASE', product.price, offer),
      transactionId: first.transactionId,
    };
    this.state.subscription = subscription;
    return subscription;
  }

  private renew(subscription: Subscription, at: Date): void {
    const product = subscription.autoRenewProduct;
    const increase = subscription.priceIncrease;
    if (increase?.status === 1) {
      subscription.price = increase.price;
      delete subscription.priceIncrease;
    }
    subscription.product = product;
    subscription.current = this.period(
      subscription,
      product,
      at,
      'RENEWAL',
      subscription.price,
      subscription.renewalOffer,
    );
    delete subscription.renewalOffer;
    delete subscription.retrySince;
    delete subscription.gracePeriodExpires;
    delete subscription.expirationIntent;
    subscription.expired = false;
  }

  private changePlan(step: Step, event: CatalogEvent, at: Date): Subscription {
    const subscription = this.subscription(event);
    const target = step.product
      ? this.product(step.product)
      : this.otherLevel(subscription, event.subtype);
    if (target.type !== 'auto-renewable' || target.group !== subscription.product.group) {
      throw new SimulationError(
        `${eventName(event.type, event.subtype)} moves within one subscription group; ${target.id} is not in group ${subscription.product.group}.`,
      );
    }
    const offer =
      event.type === 'OFFER_REDEEMED' ? this.offer(step, target, 'promotional') : undefined;
    if (event.subtype === 'UPGRADE') {
      subscription.current.isUpgraded = true;
      subscription.product = target;
      subscription.autoRenewProduct = target;
      subscription.price = target.price;
      delete subscription.priceIncrease;
      subscription.current = this.period(subscription, target, at, 'PURCHASE', target.price, offer);
      return subscription;
    }
    if (event.subtype === 'DOWNGRADE') {
      subscription.autoRenewProduct = target;
      subscription.price = target.price;
      if (offer) subscription.renewalOffer = offer;
      return subscription;
    }
    if (event.type === 'OFFER_REDEEMED' && offer) {
      subscription.renewalOffer = offer;
      return subscription;
    }
    subscription.autoRenewProduct = subscription.product;
    subscription.price = subscription.product.price;
    return subscription;
  }

  /** The product one level up (UPGRADE) or down (DOWNGRADE) in the subscription's group. */
  private otherLevel(subscription: Subscription, subtype: string | null): Product {
    const level = subscription.product.level ?? 1;
    const group = this.products.filter(
      (product) =>
        product.type === 'auto-renewable' && product.group === subscription.product.group,
    );
    const candidates =
      subtype === 'UPGRADE'
        ? group
            .filter((product) => (product.level ?? 1) < level)
            .sort((a, b) => (b.level ?? 1) - (a.level ?? 1))
        : subtype === 'DOWNGRADE'
          ? group
              .filter((product) => (product.level ?? 1) > level)
              .sort((a, b) => (a.level ?? 1) - (b.level ?? 1))
          : [subscription.product];
    const target = candidates[0];
    if (!target) {
      throw new SimulationError(
        `No product to ${subtype === 'UPGRADE' ? 'upgrade' : 'downgrade'} to from ${subscription.product.id} (level ${level}); name one with product.`,
      );
    }
    return target;
  }

  private refundEvent(step: Step, event: CatalogEvent, result: SimulatedEvent): void {
    const transaction = this.target(step, event);
    const subscription =
      this.state.subscription && this.state.subscription.current === transaction
        ? this.state.subscription
        : undefined;
    if (event.type === 'REFUND') {
      const percentage = step.refund?.percentage;
      transaction.revocation = {
        date: result.at,
        reason: step.refund?.reason ?? 0,
        type: percentage !== undefined && percentage < 100 ? 'REFUND_PRORATED' : 'REFUND_FULL',
        percentage: Math.round((percentage ?? 100) * 1000),
      };
    } else if (event.type === 'REVOKE') {
      if (transaction.ownership === 'PURCHASED') transaction.ownership = 'FAMILY_SHARED';
      transaction.revocation = {
        date: result.at,
        reason: 0,
        type: transaction.ownership === 'ASSIGNED' ? 'ASSIGNMENT_REVOKE' : 'FAMILY_REVOKE',
      };
    } else if (event.type === 'REFUND_REVERSED') {
      if (!transaction.revocation) {
        throw new SimulationError('REFUND_REVERSED follows a REFUND of the same transaction.');
      }
      delete transaction.revocation;
    } else if (event.type === 'CONSUMPTION_REQUEST') {
      result.consumptionRequestReason = step.reason ?? 'UNINTENDED_PURCHASE';
    }
    result.transaction = transaction;
    if (subscription) {
      if (event.type === 'REFUND' || event.type === 'REVOKE') subscription.autoRenewStatus = 0;
      if (
        event.type === 'REFUND_REVERSED' &&
        (transaction.expiresDate?.getTime() ?? 0) <= result.at.getTime()
      ) {
        subscription.expired = true;
      }
      result.subscription = subscription;
    }
    this.state.last = transaction;
  }

  /** The transaction a refund event is about: `product`'s latest, else the last one. */
  private target(step: Step, event: CatalogEvent): Transaction {
    if (step.product) {
      const product = this.product(step.product);
      const subscription = this.state.subscription;
      if (
        subscription &&
        product.type === 'auto-renewable' &&
        subscription.product.group === product.group
      ) {
        return subscription.current;
      }
      const purchase = [...this.state.purchases]
        .reverse()
        .find((entry) => entry.product.id === product.id);
      if (purchase) return purchase;
      throw new SimulationError(
        `${event.type}: ${product.id} has not been bought in this scenario.`,
      );
    }
    const last = this.state.last ?? this.state.subscription?.current;
    if (!last) {
      throw new SimulationError(
        `${event.type} needs a purchase first: SUBSCRIBED or ONE_TIME_CHARGE.`,
      );
    }
    return last;
  }
}
