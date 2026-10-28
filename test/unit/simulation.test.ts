import { describe, expect, it } from 'vitest';
import { eventName, events } from '../../src/catalog.js';
import { buildParts } from '../../src/sim/payloads.js';
import { SimulationError } from '../../src/sim/simulation.js';
import { standaloneSteps } from '../../src/sim/standalone.js';
import { DEFAULT_APP } from '../../src/workspace.js';
import { play, simulation, standalone } from '../helpers/sim.js';

const iso = (time: number | undefined) =>
  time === undefined ? undefined : new Date(time).toISOString();

describe('subscription life cycle', () => {
  it('starts a trial, renews at its end and refunds the renewal', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', offer: { type: 'introductory' } },
      { type: 'DID_RENEW' },
      { type: 'REFUND', refund: { reason: 1 } },
    ]);
    const [buy, renew, refund] = parts;
    expect(buy?.transaction).toMatchObject({
      offerType: 1,
      offerDiscountType: 'FREE_TRIAL',
      offerPeriod: 'P1W',
      price: 0,
      transactionReason: 'PURCHASE',
    });
    expect(buy?.transaction?.offerIdentifier).toBeUndefined();
    expect(iso(buy?.transaction?.expiresDate)).toBe('2026-10-08T09:00:00.000Z');
    expect(buy?.renewalInfo?.renewalPrice).toBe(9990);

    expect(iso(renew?.notification.signedDate)).toBe('2026-10-08T09:00:00.000Z');
    expect(renew?.transaction).toMatchObject({
      originalTransactionId: buy?.transaction?.transactionId,
      transactionReason: 'RENEWAL',
      price: 9990,
    });
    expect(renew?.transaction?.transactionId).not.toBe(buy?.transaction?.transactionId);
    expect(renew?.transaction?.webOrderLineItemId).not.toBe(buy?.transaction?.webOrderLineItemId);
    expect(iso(renew?.transaction?.expiresDate)).toBe('2026-11-08T09:00:00.000Z');

    expect(refund?.notification.data?.status).toBe(5);
    expect(refund?.transaction).toMatchObject({
      transactionId: renew?.transaction?.transactionId,
      revocationReason: 1,
      revocationType: 'REFUND_FULL',
      revocationPercentage: 100000,
    });
    expect(iso(refund?.transaction?.revocationDate)).toBe('2026-10-09T09:00:00.000Z');
    expect(refund?.renewalInfo?.autoRenewStatus).toBe(0);
  });

  it('goes through billing retry with a grace period and recovers', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'DID_FAIL_TO_RENEW', subtype: 'GRACE_PERIOD' },
      { type: 'GRACE_PERIOD_EXPIRED' },
      { type: 'DID_RENEW', subtype: 'BILLING_RECOVERY' },
    ]);
    const [, fail, graceOver, recovered] = parts;
    expect(fail?.notification.data?.status).toBe(4);
    expect(fail?.renewalInfo).toMatchObject({ isInBillingRetryPeriod: true, expirationIntent: 2 });
    expect(iso(fail?.renewalInfo?.gracePeriodExpiresDate)).toBe('2026-11-17T09:00:00.000Z');
    expect(iso(graceOver?.notification.signedDate)).toBe('2026-11-17T09:00:00.000Z');
    expect(graceOver?.notification.data?.status).toBe(3);
    expect(graceOver?.renewalInfo?.gracePeriodExpiresDate).toBeUndefined();
    expect(recovered?.notification.data?.status).toBe(1);
    expect(recovered?.renewalInfo?.isInBillingRetryPeriod).toBeUndefined();
    expect(iso(recovered?.transaction?.purchaseDate)).toBe('2026-11-18T09:00:00.000Z');
  });

  it('expires 60 days after billing retry starts', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'DID_FAIL_TO_RENEW' },
      { type: 'EXPIRED', subtype: 'BILLING_RETRY' },
    ]);
    const expired = parts[2];
    expect(iso(expired?.notification.signedDate)).toBe('2026-12-31T09:00:00.000Z');
    expect(expired?.notification.data?.status).toBe(2);
    expect(expired?.renewalInfo).toMatchObject({
      expirationIntent: 2,
      isInBillingRetryPeriod: false,
    });
  });

  it('expires voluntarily at the end of the period after auto-renew is turned off', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED', after: 'P3D' },
      { type: 'EXPIRED', subtype: 'VOLUNTARY' },
    ]);
    expect(parts[1]?.renewalInfo?.autoRenewStatus).toBe(0);
    expect(iso(parts[1]?.notification.signedDate)).toBe('2026-10-04T09:00:00.000Z');
    expect(iso(parts[2]?.notification.signedDate)).toBe('2026-11-01T09:00:00.000Z');
    expect(parts[2]?.renewalInfo?.expirationIntent).toBe(1);
  });

  it('upgrades now and downgrades at the next renewal', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', product: 'com.example.basic.monthly' },
      { type: 'DID_CHANGE_RENEWAL_PREF', subtype: 'UPGRADE' },
      { type: 'DID_CHANGE_RENEWAL_PREF', subtype: 'DOWNGRADE' },
      { type: 'DID_RENEW' },
    ]);
    const [buy, upgrade, downgrade, renew] = parts;
    expect(upgrade?.transaction).toMatchObject({
      productId: 'com.example.premium.monthly',
      transactionReason: 'PURCHASE',
      originalTransactionId: buy?.transaction?.originalTransactionId,
      price: 9990,
    });
    expect(iso(upgrade?.transaction?.purchaseDate)).toBe('2026-10-02T09:00:00.000Z');
    expect(downgrade?.renewalInfo).toMatchObject({
      productId: 'com.example.premium.monthly',
      autoRenewProductId: 'com.example.basic.monthly',
      renewalPrice: 4990,
    });
    expect(downgrade?.transaction?.productId).toBe('com.example.premium.monthly');
    expect(renew?.transaction).toMatchObject({
      productId: 'com.example.basic.monthly',
      transactionReason: 'RENEWAL',
      price: 4990,
    });
  });

  it('charges an accepted price increase from the next renewal', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'PRICE_INCREASE', subtype: 'PENDING', price: 12.99 },
      { type: 'PRICE_INCREASE', subtype: 'ACCEPTED' },
      { type: 'DID_RENEW' },
      { type: 'DID_RENEW' },
    ]);
    expect(parts[1]?.renewalInfo).toMatchObject({ priceIncreaseStatus: 0, renewalPrice: 12990 });
    expect(parts[2]?.renewalInfo).toMatchObject({ priceIncreaseStatus: 1, renewalPrice: 12990 });
    expect(parts[3]?.transaction?.price).toBe(12990);
    expect(parts[3]?.renewalInfo?.priceIncreaseStatus).toBeUndefined();
    expect(parts[4]?.transaction?.price).toBe(12990);
  });

  it('resubscribes with a win-back offer after expiring', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'DID_CHANGE_RENEWAL_STATUS', subtype: 'AUTO_RENEW_DISABLED' },
      { type: 'EXPIRED', subtype: 'VOLUNTARY' },
      { type: 'SUBSCRIBED', subtype: 'RESUBSCRIBE', offer: { type: 'win-back', id: 'come-back' } },
    ]);
    const back = parts[3];
    expect(back?.transaction).toMatchObject({
      offerType: 4,
      offerIdentifier: 'come-back',
      offerDiscountType: 'PAY_AS_YOU_GO',
      price: 5000,
    });
    expect(back?.transaction?.originalTransactionId).toBe(parts[0]?.transaction?.transactionId);
    expect(back?.notification.data?.status).toBe(1);
    expect(back?.renewalInfo?.recentSubscriptionStartDate).toBe(
      parts[0]?.renewalInfo?.recentSubscriptionStartDate,
    );
  });

  it('dates the current run of service anew after a lapse of more than 60 days', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'EXPIRED', subtype: 'VOLUNTARY' },
      { type: 'SUBSCRIBED', subtype: 'RESUBSCRIBE', after: 'P90D' },
    ]);
    expect(iso(parts[2]?.renewalInfo?.recentSubscriptionStartDate)).toBe(
      '2027-01-30T09:00:00.000Z',
    );
  });

  it('reverses a refund and revokes Family Sharing access', () => {
    const refunded = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'REFUND', refund: { percentage: 40 } },
      { type: 'REFUND_REVERSED' },
    ]).parts;
    expect(refunded[1]?.transaction).toMatchObject({
      revocationType: 'REFUND_PRORATED',
      revocationPercentage: 40000,
    });
    expect(refunded[2]?.transaction?.revocationDate).toBeUndefined();
    expect(refunded[2]?.notification.data?.status).toBe(1);

    const family = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', ownership: 'FAMILY_SHARED' },
      { type: 'REVOKE' },
    ]).parts[1];
    expect(family?.transaction).toMatchObject({
      inAppOwnershipType: 'FAMILY_SHARED',
      revocationType: 'FAMILY_REVOKE',
      revocationReason: 0,
    });
    const assigned = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', ownership: 'ASSIGNED', quantity: 25 },
      { type: 'REVOKE' },
    ]).parts[1];
    expect(assigned?.transaction).toMatchObject({
      inAppOwnershipType: 'ASSIGNED',
      revocationType: 'ASSIGNMENT_REVOKE',
      quantity: 25,
    });
  });

  it('refunds a consumable with no renewal info or status', () => {
    const { parts } = play([
      { type: 'ONE_TIME_CHARGE', product: 'com.example.coins.100', quantity: 3 },
      { type: 'CONSUMPTION_REQUEST', reason: 'FULFILLMENT_ISSUE' },
      { type: 'REFUND' },
    ]);
    expect(parts[0]?.transaction).toMatchObject({ type: 'Consumable', quantity: 3, price: 990 });
    expect(parts[0]?.transaction?.expiresDate).toBeUndefined();
    expect(parts[1]?.notification.data?.consumptionRequestReason).toBe('FULFILLMENT_ISSUE');
    for (const part of parts) {
      expect(part.renewalInfo).toBeUndefined();
      expect(part.notification.data?.status).toBeUndefined();
    }
  });

  it('extends the renewal date and summarizes a mass extension', () => {
    const { parts } = play([
      { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
      { type: 'RENEWAL_EXTENDED', extendBy: 'P10D' },
      { type: 'RENEWAL_EXTENSION', subtype: 'SUMMARY' },
    ]);
    expect(iso(parts[1]?.transaction?.expiresDate)).toBe('2026-11-11T09:00:00.000Z');
    expect(parts[1]?.renewalInfo?.renewalDate).toBe(parts[1]?.transaction?.expiresDate);
    expect(parts[2]?.notification.data).toBeUndefined();
    expect(parts[2]?.notification.summary).toMatchObject({
      productId: 'com.example.premium.monthly',
      bundleId: 'com.example.app',
      environment: 'Sandbox',
      succeededCount: 1,
      failedCount: 0,
    });
  });
});

describe('payload rules', () => {
  it('leaves appAppleId out in Sandbox and writes it in Production', () => {
    expect(standalone('DID_RENEW').last.notification.data?.appAppleId).toBeUndefined();
    const production = simulation({
      app: { ...DEFAULT_APP, environment: 'Production', appAppleId: 1234 },
    });
    const { last } = standalone('DID_RENEW', undefined, production);
    expect(last.notification.data).toMatchObject({ appAppleId: 1234, environment: 'Production' });
    expect(last.transaction?.environment).toBe('Production');
  });

  it('marks Sandbox external purchase tokens as Apple’s verifier expects', () => {
    const token = standalone('EXTERNAL_PURCHASE_TOKEN', 'CREATED').last.notification
      .externalPurchaseToken;
    expect(token?.externalPurchaseId).toMatch(/^SANDBOX_/);
    expect(token?.tokenType).toBe('SERVICES');
    const unreported = standalone('EXTERNAL_PURCHASE_TOKEN', 'UNREPORTED').last.notification
      .externalPurchaseToken;
    expect(unreported?.tokenType).toBeUndefined();
  });

  it('merges set overrides last and deletes fields set to null', () => {
    const { parts } = play([
      {
        type: 'SUBSCRIBED',
        subtype: 'INITIAL_BUY',
        set: {
          transaction: { price: null, storefront: 'TUR' },
          data: { bundleVersion: '42' },
          notification: { extra: true },
          renewalInfo: { autoRenewStatus: 0 },
        },
      },
    ]);
    expect(parts[0]?.transaction?.price).toBeUndefined();
    expect(parts[0]?.transaction?.storefront).toBe('TUR');
    expect(parts[0]?.notification.data?.bundleVersion).toBe('42');
    expect(parts[0]?.notification.extra).toBe(true);
    expect(parts[0]?.renewalInfo?.autoRenewStatus).toBe(0);
  });

  it('shifts every date by the same amount', () => {
    const sim = simulation();
    const event = sim.apply({ type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' });
    const plain = buildParts(sim, event);
    const shifted = buildParts(sim, event, 1000);
    expect(shifted.notification.signedDate - plain.notification.signedDate).toBe(1000);
    expect((shifted.transaction?.expiresDate ?? 0) - (plain.transaction?.expiresDate ?? 0)).toBe(
      1000,
    );
    expect((shifted.renewalInfo?.renewalDate ?? 0) - (plain.renewalInfo?.renewalDate ?? 0)).toBe(
      1000,
    );
  });
});

describe('errors', () => {
  const fails = (steps: Parameters<typeof play>[0]) => () => play(steps);

  it('explains events that need a history', () => {
    expect(fails([{ type: 'DID_RENEW' }])).toThrow('start the scenario with SUBSCRIBED');
    expect(fails([{ type: 'REFUND' }])).toThrow('needs a purchase first');
    expect(
      fails([
        { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
        { type: 'DID_RENEW', subtype: 'BILLING_RECOVERY' },
      ]),
    ).toThrow('add DID_FAIL_TO_RENEW first');
    expect(
      fails([{ type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' }, { type: 'GRACE_PERIOD_EXPIRED' }]),
    ).toThrow('follows DID_FAIL_TO_RENEW/GRACE_PERIOD');
    expect(
      fails([{ type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' }, { type: 'REFUND_REVERSED' }]),
    ).toThrow('follows a REFUND');
  });

  it('rejects products of the wrong kind and steps back in time', () => {
    expect(
      fails([{ type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', product: 'com.example.coins.100' }]),
    ).toThrow('use ONE_TIME_CHARGE');
    expect(fails([{ type: 'ONE_TIME_CHARGE', product: 'com.example.premium.monthly' }])).toThrow(
      'use SUBSCRIBED',
    );
    expect(fails([{ type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', product: 'nope' }])).toThrow(
      'Unknown product nope',
    );
    expect(
      fails([
        { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY' },
        { type: 'DID_CHANGE_RENEWAL_PREF', subtype: 'UPGRADE' },
      ]),
    ).toThrow('No product to upgrade to');
    expect(
      fails([
        { type: 'SUBSCRIBED', subtype: 'INITIAL_BUY', at: '2026-10-05T00:00:00Z' },
        { type: 'DID_RENEW', at: '2026-10-01T00:00:00Z' },
      ]),
    ).toThrow(SimulationError);
  });
});

describe('standaloneSteps', () => {
  it('plays a history for every event of the catalog', () => {
    for (const event of events()) {
      const { last } = standalone(event.type, event.subtype);
      expect(last.notification.notificationType, eventName(event.type, event.subtype)).toBe(
        event.type,
      );
      expect(last.notification.subtype ?? null).toBe(event.subtype);
    }
  });

  it('buys a one-time product first when one is named', () => {
    expect(
      standaloneSteps('REFUND_REVERSED', undefined, { product: 'com.example.lifetime' }).steps,
    ).toEqual([
      { type: 'ONE_TIME_CHARGE', product: 'com.example.lifetime' },
      { type: 'REFUND', product: 'com.example.lifetime' },
      { type: 'REFUND_REVERSED', subtype: null, product: 'com.example.lifetime' },
    ]);
    expect(() => standaloneSteps('REFUND', undefined, { product: 'x' })).toThrow(
      'Unknown product x',
    );
  });
});
