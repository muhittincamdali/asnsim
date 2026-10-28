import { type CatalogEvent, findEvent } from '../catalog.js';
import { DEFAULT_PRODUCTS, type Product } from './products.js';
import { SimulationError } from './simulation.js';
import type { StepInput } from './step.js';

// `asnsim send DID_RENEW/BILLING_RECOVERY` sends one notification, but the notification only makes
// sense after a history: a subscription, a failed renewal. These are the steps asnsim plays
// silently first, so the one notification it sends has consistent transaction IDs, dates and
// renewal state.

const KEY = (type: string, subtype: string | null) => (subtype ? `${type}/${subtype}` : type);

const SUBSCRIBE: StepInput = { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' };
/** Stands for a subscription to the lowest level of the group, so that an upgrade has a target. */
const SUBSCRIBE_LOWEST: StepInput = { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' };

const HISTORY: Record<string, StepInput[]> = {
  'SUBSCRIBED/INITIAL_BUY': [],
  'SUBSCRIBED/RESUBSCRIBE': [
    SUBSCRIBE,
    { type: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED' },
    { type: 'EXPIRED', subtype: 'VOLUNTARY' },
  ],
  'DID_RENEW/BILLING_RECOVERY': [SUBSCRIBE, { type: 'DID_FAIL_TO_RENEW', subtype: null }],
  GRACE_PERIOD_EXPIRED: [SUBSCRIBE, { type: 'DID_FAIL_TO_RENEW', subtype: 'GRACE_PERIOD' }],
  'EXPIRED/VOLUNTARY': [
    SUBSCRIBE,
    { type: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED' },
  ],
  'EXPIRED/BILLING_RETRY': [SUBSCRIBE, { type: 'DID_FAIL_TO_RENEW', subtype: null }],
  'EXPIRED/PRICE_INCREASE': [SUBSCRIBE, { type: 'PRICE_INCREASE', subtype: 'PENDING' }],
  'DID_CHANGE_RENEWAL_STATUS/AUTO_RENEW_ENABLED': [
    SUBSCRIBE,
    { type: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED' },
  ],
  DID_CHANGE_RENEWAL_STATUS: [SUBSCRIBE, { type: 'PRICE_INCREASE', subtype: 'PENDING' }],
  'DID_CHANGE_RENEWAL_PREF/UPGRADE': [SUBSCRIBE_LOWEST],
  DID_CHANGE_RENEWAL_PREF: [SUBSCRIBE, { type: 'DID_CHANGE_RENEWAL_PREF', subtype: 'DOWNGRADE' }],
  'OFFER_REDEEMED/UPGRADE': [SUBSCRIBE_LOWEST],
  'PRICE_INCREASE/ACCEPTED': [SUBSCRIBE, { type: 'PRICE_INCREASE', subtype: 'PENDING' }],
  REFUND_REVERSED: [SUBSCRIBE, { type: 'REFUND' }],
  REVOKE: [{ ...SUBSCRIBE, ownership: 'FAMILY_SHARED' }],
  TEST: [],
  ONE_TIME_CHARGE: [],
  'EXTERNAL_PURCHASE_TOKEN/UNREPORTED': [],
  'EXTERNAL_PURCHASE_TOKEN/CREATED': [],
  'EXTERNAL_PURCHASE_TOKEN/ACTIVE_TOKEN_REMINDER': [],
  RESCIND_CONSENT: [],
};

export interface StandaloneOptions {
  /** The product of the event: the subscription to renew, the consumable to refund. */
  product?: string;
  products?: Product[];
}

const REFUND_TYPES = [
  'REFUND',
  'REFUND_DECLINED',
  'REFUND_REVERSED',
  'CONSUMPTION_REQUEST',
  'REVOKE',
];

/** The steps to play for one notification: its history, then the event itself, last. */
export function standaloneSteps(
  type: string,
  subtype?: string | null,
  options: StandaloneOptions = {},
): { event: CatalogEvent; steps: StepInput[] } {
  const event = findEvent(type, subtype);
  const products = options.products ?? DEFAULT_PRODUCTS;
  const product = options.product
    ? products.find((entry) => entry.id === options.product)
    : undefined;
  if (options.product && !product) {
    throw new SimulationError(
      `Unknown product ${options.product}. Products: ${products.map((entry) => entry.id).join(', ')}.`,
    );
  }
  const step: StepInput = { type: event.type, subtype: event.subtype };
  if (product) step.product = product.id;
  if (product && product.type !== 'auto-renewable' && REFUND_TYPES.includes(event.type)) {
    const buy: StepInput = { type: 'ONE_TIME_CHARGE', product: product.id };
    if (event.type === 'REVOKE') buy.ownership = 'FAMILY_SHARED';
    const history =
      event.type === 'REFUND_REVERSED' ? [buy, { type: 'REFUND', product: product.id }] : [buy];
    return { event, steps: [...history, step] };
  }
  // A named subscription is the one the history subscribes to, unless the event moves to it.
  const moves = event.subtype === 'UPGRADE' || event.subtype === 'DOWNGRADE';
  const lowest = lowestLevel(products);
  const history = (HISTORY[KEY(event.type, event.subtype)] ?? [SUBSCRIBE]).map((entry) => {
    if (entry === SUBSCRIBE_LOWEST) return lowest ? { ...entry, product: lowest.id } : entry;
    return entry.type === 'SUBSCRIBED' && product?.type === 'auto-renewable' && !moves
      ? { ...entry, product: product.id }
      : entry;
  });
  return { event, steps: [...history, step] };
}

/** The lowest level (highest number) of the first subscription group. */
function lowestLevel(products: Product[]): Product | undefined {
  const first = products.find((entry) => entry.type === 'auto-renewable');
  return products
    .filter((entry) => entry.type === 'auto-renewable' && entry.group === first?.group)
    .sort((a, b) => (b.level ?? 1) - (a.level ?? 1))[0];
}
