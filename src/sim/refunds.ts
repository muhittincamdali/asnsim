import type { CatalogEvent } from '../catalog.js';
import { SimulationError } from './error.js';
import type { Shop } from './purchases.js';
import type { SimulatedEvent } from './simulation.js';
import type { Transaction } from './state.js';
import type { Step } from './step.js';

// REFUND, REFUND_DECLINED, REFUND_REVERSED, CONSUMPTION_REQUEST and REVOKE: what they do to the
// transaction they are about, and to the subscription when it is the subscription's current one.

/** The transaction a refund event is about: `product`'s latest, else the last one. */
function refundTarget(shop: Shop, step: Step, event: CatalogEvent): Transaction {
  const { state } = shop;
  if (step.product) {
    const product = shop.product(step.product);
    const subscription = state.subscription;
    if (
      subscription &&
      product.type === 'auto-renewable' &&
      subscription.product.group === product.group
    ) {
      return subscription.current;
    }
    const purchase = [...state.purchases]
      .reverse()
      .find((entry) => entry.product.id === product.id);
    if (purchase) return purchase;
    throw new SimulationError(`${event.type}: ${product.id} has not been bought in this scenario.`);
  }
  const last = state.last ?? state.subscription?.current;
  if (!last) {
    throw new SimulationError(
      `${event.type} needs a purchase first: SUBSCRIBED or ONE_TIME_CHARGE.`,
    );
  }
  return last;
}

function revoke(transaction: Transaction, step: Step, event: CatalogEvent, at: Date): void {
  if (event.type === 'REFUND') {
    const percentage = step.refund?.percentage;
    transaction.revocation = {
      date: at,
      reason: step.refund?.reason ?? 0,
      type: percentage !== undefined && percentage < 100 ? 'REFUND_PRORATED' : 'REFUND_FULL',
      percentage: Math.round((percentage ?? 100) * 1000),
    };
  } else if (event.type === 'REVOKE') {
    if (transaction.ownership === 'PURCHASED') transaction.ownership = 'FAMILY_SHARED';
    transaction.revocation = {
      date: at,
      reason: 0,
      type: transaction.ownership === 'ASSIGNED' ? 'ASSIGNMENT_REVOKE' : 'FAMILY_REVOKE',
    };
  } else if (event.type === 'REFUND_REVERSED') {
    if (!transaction.revocation) {
      throw new SimulationError('REFUND_REVERSED follows a REFUND of the same transaction.');
    }
    delete transaction.revocation;
  }
}

export function refundEvent(
  shop: Shop,
  step: Step,
  event: CatalogEvent,
  result: SimulatedEvent,
): void {
  const { state } = shop;
  const transaction = refundTarget(shop, step, event);
  const subscription =
    state.subscription && state.subscription.current === transaction
      ? state.subscription
      : undefined;
  revoke(transaction, step, event, result.at);
  if (event.type === 'CONSUMPTION_REQUEST') {
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
  state.last = transaction;
}
