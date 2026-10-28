import { type CatalogEvent, eventName } from '../catalog.js';
import { addDuration } from './duration.js';
import { SimulationError } from './error.js';
import type { Product } from './products.js';
import type { Random } from './random.js';
import type { CustomerState, Offer, Ownership, Subscription, Transaction } from './state.js';
import type { Step } from './step.js';

// The purchases a simulation makes: new transactions, subscription periods and offers, starting,
// renewing and changing a subscription, and one-time charges.

/** What the purchase rules read and change; a Simulation is one. */
export interface Shop {
  readonly products: Product[];
  readonly random: Random;
  readonly state: CustomerState;
  product(id: string): Product;
}

/** Apple's offerType values. */
const OFFER_TYPE = { introductory: 1, promotional: 2, 'offer-code': 3, 'win-back': 4 } as const;

export const transactionId = (random: Random) => `2${random.digits(15)}`;

export function requireSubscription(state: CustomerState, event: CatalogEvent): Subscription {
  const subscription = state.subscription;
  if (!subscription) {
    throw new SimulationError(
      `${eventName(event.type, event.subtype)} needs a subscription: start the scenario with SUBSCRIBED.`,
    );
  }
  return subscription;
}

function firstOfType(shop: Shop, type: Product['type']): Product {
  const product = shop.products.find((entry) => entry.type === type);
  if (!product) throw new SimulationError(`The scenario declares no ${type} product.`);
  return product;
}

function offerFor(step: Step, product: Product, fallbackType: keyof typeof OFFER_TYPE): Offer {
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

function newTransaction(
  random: Random,
  product: Product,
  at: Date,
  reason: Transaction['reason'],
  extra: Partial<Transaction> = {},
): Transaction {
  const id = transactionId(random);
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
function nextPeriod(
  random: Random,
  subscription: Subscription,
  product: Product,
  at: Date,
  reason: Transaction['reason'],
  price: number,
  offer?: Offer,
): Transaction {
  const length = offer && offer.discount !== 'PAY_AS_YOU_GO' ? offer.period : product.period;
  const transaction = newTransaction(random, product, at, reason, {
    originalTransactionId: subscription.originalTransactionId,
    originalPurchaseDate: subscription.originalPurchaseDate,
    webOrderLineItemId: `2${random.digits(15)}`,
    expiresDate: addDuration(at, length ?? 'P1M'),
    price: offer ? offer.price : price,
    quantity: subscription.current.quantity,
    ownership: subscription.current.ownership,
  });
  if (offer) transaction.offer = offer;
  return transaction;
}

/** SUBSCRIBED/RESUBSCRIBE: the earlier subscription of the group starts again. */
function resubscribe(shop: Shop, step: Step, product: Product, at: Date): Subscription {
  const existing = shop.state.subscription;
  if (!existing) {
    throw new SimulationError('SUBSCRIBED/RESUBSCRIBE needs an earlier subscription in the group.');
  }
  // recentSubscriptionStartDate ignores lapses of paid service of 60 days or fewer.
  const lapse = at.getTime() - (existing.current.expiresDate ?? at).getTime();
  if (lapse > 60 * 86_400_000) existing.recentStart = at;
  const offer = step.offer ? offerFor(step, product, 'win-back') : undefined;
  existing.product = product;
  existing.autoRenewProduct = product;
  existing.price = product.price;
  existing.current = nextPeriod(
    shop.random,
    existing,
    product,
    at,
    'PURCHASE',
    product.price,
    offer,
  );
  existing.expired = false;
  existing.autoRenewStatus = 1;
  delete existing.expirationIntent;
  delete existing.retrySince;
  delete existing.gracePeriodExpires;
  delete existing.priceIncrease;
  return existing;
}

export function subscribe(shop: Shop, step: Step, event: CatalogEvent, at: Date): Subscription {
  const product = step.product ? shop.product(step.product) : firstOfType(shop, 'auto-renewable');
  if (product.type !== 'auto-renewable') {
    throw new SimulationError(
      `SUBSCRIBED is for auto-renewable subscriptions; ${product.id} is ${product.type} (use ONE_TIME_CHARGE).`,
    );
  }
  if (event.subtype === 'RESUBSCRIBE') return resubscribe(shop, step, product, at);
  const offer = step.offer ? offerFor(step, product, 'introductory') : undefined;
  const first = newTransaction(shop.random, product, at, 'PURCHASE', {
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
    ...nextPeriod(shop.random, subscription, product, at, 'PURCHASE', product.price, offer),
    transactionId: first.transactionId,
  };
  shop.state.subscription = subscription;
  return subscription;
}

export function renew(random: Random, subscription: Subscription, at: Date): void {
  const product = subscription.autoRenewProduct;
  const increase = subscription.priceIncrease;
  if (increase?.status === 1) {
    subscription.price = increase.price;
    delete subscription.priceIncrease;
  }
  subscription.product = product;
  subscription.current = nextPeriod(
    random,
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

export function changePlan(shop: Shop, step: Step, event: CatalogEvent, at: Date): Subscription {
  const subscription = requireSubscription(shop.state, event);
  const target = step.product
    ? shop.product(step.product)
    : otherLevel(shop.products, subscription, event.subtype);
  if (target.type !== 'auto-renewable' || target.group !== subscription.product.group) {
    throw new SimulationError(
      `${eventName(event.type, event.subtype)} moves within one subscription group; ${target.id} is not in group ${subscription.product.group}.`,
    );
  }
  const offer = event.type === 'OFFER_REDEEMED' ? offerFor(step, target, 'promotional') : undefined;
  if (event.subtype === 'UPGRADE') {
    subscription.current.isUpgraded = true;
    subscription.product = target;
    subscription.autoRenewProduct = target;
    subscription.price = target.price;
    delete subscription.priceIncrease;
    subscription.current = nextPeriod(
      shop.random,
      subscription,
      target,
      at,
      'PURCHASE',
      target.price,
      offer,
    );
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
function otherLevel(
  products: Product[],
  subscription: Subscription,
  subtype: string | null,
): Product {
  const level = subscription.product.level ?? 1;
  const group = products.filter(
    (product) => product.type === 'auto-renewable' && product.group === subscription.product.group,
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

/** ONE_TIME_CHARGE: a consumable, non-consumable or non-renewing subscription bought at `at`. */
export function oneTimeCharge(shop: Shop, step: Step, at: Date): Transaction {
  const product = step.product ? shop.product(step.product) : firstOfType(shop, 'consumable');
  if (product.type === 'auto-renewable') {
    throw new SimulationError(
      `ONE_TIME_CHARGE is for consumables, non-consumables and non-renewing subscriptions; ${product.id} is auto-renewable (use SUBSCRIBED).`,
    );
  }
  const transaction = newTransaction(shop.random, product, at, 'PURCHASE', {
    quantity: step.quantity ?? 1,
    ownership: (step.ownership ?? 'PURCHASED') as Ownership,
    price: product.price,
  });
  if (step.offer) {
    transaction.offer = { ...offerFor(step, product, 'offer-code'), discount: 'ONE_TIME' };
  }
  shop.state.purchases.push(transaction);
  shop.state.last = transaction;
  return transaction;
}
