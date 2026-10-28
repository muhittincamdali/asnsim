import type { Product } from './products.js';

// The state of one simulated customer: one subscription (one group) and any one-time purchases.
// Steps change it; payloads.ts turns it into the JSON Apple's notifications carry.

export type Ownership = 'PURCHASED' | 'FAMILY_SHARED' | 'ASSIGNED';

export interface Offer {
  /** offerType: 1 introductory, 2 promotional, 3 offer code, 4 win-back. */
  type: 1 | 2 | 3 | 4;
  identifier?: string;
  discount: 'FREE_TRIAL' | 'PAY_AS_YOU_GO' | 'PAY_UP_FRONT' | 'ONE_TIME';
  /** ISO 8601 duration of the offer, offerPeriod. */
  period: string;
  /** Price during the offer, in the currency's units. */
  price: number;
}

export interface Revocation {
  date: Date;
  reason: 0 | 1;
  type: 'REFUND_FULL' | 'REFUND_PRORATED' | 'FAMILY_REVOKE' | 'ASSIGNMENT_REVOKE';
  /** Milliunits of a percent: 100000 is 100%. */
  percentage?: number;
}

export interface Transaction {
  transactionId: string;
  originalTransactionId: string;
  webOrderLineItemId?: string;
  product: Product;
  purchaseDate: Date;
  originalPurchaseDate: Date;
  expiresDate?: Date;
  reason: 'PURCHASE' | 'RENEWAL';
  /** Price charged, in the currency's units. */
  price: number;
  quantity: number;
  ownership: Ownership;
  offer?: Offer;
  revocation?: Revocation;
  isUpgraded?: boolean;
  previousOriginalTransactionId?: string;
}

export interface Subscription {
  product: Product;
  autoRenewProduct: Product;
  originalTransactionId: string;
  originalPurchaseDate: Date;
  /** recentSubscriptionStartDate: start of the current run of paid service. */
  recentStart: Date;
  current: Transaction;
  autoRenewStatus: 0 | 1;
  /** Set while the App Store retries billing. */
  retrySince?: Date;
  gracePeriodExpires?: Date;
  expired: boolean;
  expirationIntent?: 1 | 2 | 3 | 4 | 5;
  /** Price per period of autoRenewProduct, in the currency's units, before any increase. */
  price: number;
  priceIncrease?: { status: 0 | 1; price: number };
  /** An offer that applies from the next renewal. */
  renewalOffer?: Offer;
}

export interface CustomerState {
  subscription?: Subscription;
  purchases: Transaction[];
  /** The transaction the last notification was about: the default target of refunds. */
  last?: Transaction;
  appTransactionId: string;
  appAccountToken?: string;
}

/** data.status for the subscription: 1 active, 2 expired, 3 billing retry, 4 grace, 5 revoked. */
export function subscriptionStatus(subscription: Subscription): 1 | 2 | 3 | 4 | 5 {
  if (subscription.current.revocation) return 5;
  if (subscription.expired) return 2;
  if (subscription.gracePeriodExpires) return 4;
  if (subscription.retrySince) return 3;
  return 1;
}
