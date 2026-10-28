import { signJws } from '../jws/jws.js';
import type {
  AppTransactionPayload,
  DataObject,
  NotificationPayload,
  RenewalInfoPayload,
  TransactionPayload,
} from '../model.js';
import type { TestChain } from '../pki/chain.js';
import { APPLE_PRODUCT_TYPE } from '../catalog.js';
import { addDuration } from './duration.js';
import { milliunits } from './products.js';
import type { SimulatedEvent, Simulation } from './simulation.js';
import { type Subscription, subscriptionStatus, type Transaction } from './state.js';

// Turns a simulated event into the JSON of a notification and signs it. Every date is shifted by
// `shift` milliseconds, which is how the runner makes each event happen "now" in live mode while
// the scenario's own timeline keeps the gaps between dates.

export interface NotificationParts {
  notification: NotificationPayload;
  transaction?: TransactionPayload;
  renewalInfo?: RenewalInfoPayload;
  appTransaction?: AppTransactionPayload;
}

const time = (date: Date, shift: number) => date.getTime() + shift;

/** `object` without its undefined fields, typed with those fields optional. */
type Compact<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

function compact<T extends object>(object: T): Compact<T> {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  ) as Compact<T>;
}

/** Shallow merge where null removes a field: `set: { transaction: { price: null } }`. */
function merge<T extends Record<string, unknown>>(base: T, extra?: Record<string, unknown>): T {
  if (!extra) return base;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (value === null) delete merged[key];
    else merged[key] = value;
  }
  return merged as T;
}

function transactionPayload(
  sim: Simulation,
  transaction: Transaction,
  signedDate: number,
  shift: number,
): TransactionPayload {
  const { product, offer, revocation } = transaction;
  return compact({
    transactionId: transaction.transactionId,
    originalTransactionId: transaction.originalTransactionId,
    webOrderLineItemId: transaction.webOrderLineItemId,
    bundleId: sim.app.bundleId,
    productId: product.id,
    subscriptionGroupIdentifier: product.group,
    purchaseDate: time(transaction.purchaseDate, shift),
    originalPurchaseDate: time(transaction.originalPurchaseDate, shift),
    expiresDate: transaction.expiresDate ? time(transaction.expiresDate, shift) : undefined,
    quantity: transaction.quantity,
    type: APPLE_PRODUCT_TYPE[product.type],
    appAccountToken: sim.state.appAccountToken,
    inAppOwnershipType: transaction.ownership,
    signedDate,
    revocationReason: revocation?.reason,
    revocationDate: revocation ? time(revocation.date, shift) : undefined,
    revocationType: revocation?.type,
    revocationPercentage: revocation?.percentage,
    isUpgraded: transaction.isUpgraded,
    offerType: offer?.type,
    offerIdentifier: offer?.identifier,
    offerDiscountType: offer?.discount,
    offerPeriod: offer && offer.discount !== 'ONE_TIME' ? offer.period : undefined,
    environment: sim.app.environment,
    transactionReason: transaction.reason,
    storefront: sim.storefront.code,
    storefrontId: sim.storefront.id,
    price: milliunits(transaction.price),
    currency: product.currency,
    appTransactionId: sim.state.appTransactionId,
    previousOriginalTransactionId: transaction.previousOriginalTransactionId,
  });
}

function renewalInfoPayload(
  sim: Simulation,
  subscription: Subscription,
  signedDate: number,
  shift: number,
): RenewalInfoPayload {
  const offer = subscription.renewalOffer;
  const retrying = subscription.retrySince !== undefined;
  const price = offer?.price ?? subscription.priceIncrease?.price ?? subscription.price;
  const expires = subscription.current.expiresDate ?? subscription.current.purchaseDate;
  return compact({
    originalTransactionId: subscription.originalTransactionId,
    autoRenewProductId: subscription.autoRenewProduct.id,
    productId: subscription.product.id,
    autoRenewStatus: subscription.autoRenewStatus,
    expirationIntent: subscription.expirationIntent,
    isInBillingRetryPeriod: retrying || subscription.expired ? retrying : undefined,
    gracePeriodExpiresDate: subscription.gracePeriodExpires
      ? time(subscription.gracePeriodExpires, shift)
      : undefined,
    priceIncreaseStatus: subscription.priceIncrease?.status,
    offerType: offer?.type,
    offerIdentifier: offer?.identifier,
    offerDiscountType: offer && offer.discount !== 'ONE_TIME' ? offer.discount : undefined,
    offerPeriod: offer?.period,
    renewalPrice: milliunits(price),
    currency: subscription.autoRenewProduct.currency,
    signedDate,
    environment: sim.app.environment,
    recentSubscriptionStartDate: time(subscription.recentStart, shift),
    renewalDate: time(expires, shift),
    appTransactionId: sim.state.appTransactionId,
    appAccountToken: sim.state.appAccountToken,
  });
}

const production = (sim: Simulation) =>
  sim.app.environment === 'Production' ? sim.app.appAppleId : undefined;

/** The decoded payloads of `event`'s notification, before signing. */
export function buildParts(sim: Simulation, event: SimulatedEvent, shift = 0): NotificationParts {
  const signedDate = time(event.at, shift);
  const set = event.step.set;
  const parts: Partial<NotificationParts> = {};
  const notification: NotificationPayload = compact({
    notificationType: event.event.type,
    subtype: event.event.subtype ?? undefined,
    notificationUUID: event.notificationUUID,
    version: '2.0' as const,
    signedDate,
  });
  const app = { appAppleId: production(sim), bundleId: sim.app.bundleId };
  if (event.event.payload === 'summary' && event.summary) {
    notification.summary = compact({
      requestIdentifier: event.summary.requestIdentifier,
      environment: sim.app.environment,
      ...app,
      productId: event.summary.productId,
      failedCount: 0,
      succeededCount: 1,
    });
  } else if (event.event.payload === 'externalPurchaseToken' && event.externalPurchaseToken) {
    const { externalPurchaseId, custom } = event.externalPurchaseToken;
    notification.externalPurchaseToken = compact({
      externalPurchaseId,
      tokenCreationDate: signedDate,
      appAppleId: sim.app.appAppleId,
      bundleId: sim.app.bundleId,
      tokenExpirationDate: custom ? time(addDuration(event.at, 'P1Y'), shift) : undefined,
      tokenType: custom ? ('SERVICES' as const) : undefined,
    });
  } else if (event.event.payload === 'appData') {
    parts.appTransaction = compact({
      receiptType: sim.app.environment,
      appAppleId: production(sim),
      bundleId: sim.app.bundleId,
      originalApplicationVersion: sim.app.bundleVersion,
      receiptCreationDate: signedDate,
      originalPurchaseDate: signedDate,
      originalPlatform: 'iOS',
      appTransactionId: sim.state.appTransactionId,
    });
    notification.appData = compact({ ...app, environment: sim.app.environment });
  } else {
    const data: DataObject = compact({
      ...app,
      bundleVersion: sim.app.bundleVersion,
      environment: sim.app.environment,
      status: event.subscription ? subscriptionStatus(event.subscription) : undefined,
      consumptionRequestReason: event.consumptionRequestReason,
    });
    if (event.transaction) {
      parts.transaction = merge(
        transactionPayload(sim, event.transaction, signedDate, shift),
        set?.transaction,
      );
    }
    if (event.subscription) {
      parts.renewalInfo = merge(
        renewalInfoPayload(sim, event.subscription, signedDate, shift),
        set?.renewalInfo,
      );
    }
    notification.data = merge(data, set?.data);
  }
  // Apple's field order: type, subtype and UUID, then the payload object, then version and date.
  const { version, signedDate: date, ...head } = notification;
  return {
    notification: merge({ ...head, version, signedDate: date }, set?.notification),
    ...parts,
  };
}

export interface SignedNotification extends NotificationParts {
  /** The JWS the App Store would POST as { "signedPayload": … }. */
  signedPayload: string;
}

/** Signs the inner payloads first, puts them into data or appData, then signs the notification. */
export function signParts(parts: NotificationParts, chain: TestChain): SignedNotification {
  const x5c = [chain.signing, chain.intermediate, chain.root];
  const sign = (payload: unknown) => signJws(payload, chain.signingKey, x5c);
  const notification: NotificationPayload = { ...parts.notification };
  if (notification.data) {
    const data: DataObject = { ...notification.data };
    // Keep Apple's field order: signed fields follow environment, status comes after them.
    const { status, consumptionRequestReason, ...rest } = data;
    const signed: DataObject = { ...rest };
    if (parts.transaction) signed.signedTransactionInfo = sign(parts.transaction);
    if (parts.renewalInfo) signed.signedRenewalInfo = sign(parts.renewalInfo);
    if (status !== undefined) signed.status = status;
    if (consumptionRequestReason !== undefined) {
      signed.consumptionRequestReason = consumptionRequestReason;
    }
    notification.data = signed;
  }
  if (notification.appData && parts.appTransaction) {
    notification.appData = {
      ...notification.appData,
      signedAppTransactionInfo: sign(parts.appTransaction),
    };
  }
  return { ...parts, notification, signedPayload: sign(notification) };
}
