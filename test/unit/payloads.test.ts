import { describe, expect, it } from 'vitest';
import { eventName, events } from '../../src/catalog.js';
import { decodeJws } from '../../src/jws/jws.js';
import { createTestChain } from '../../src/pki/chain.js';
import { signParts } from '../../src/sim/payloads.js';
import { standalone } from '../helpers/sim.js';

// The decoded payloads of the notification `asnsim send` writes for each event, with a fixed start
// and seed. test/__snapshots__/payloads/ holds one file per event: a change to what asnsim sends
// shows up as a diff there.

const fileName = (type: string, subtype: string | null) =>
  `../__snapshots__/payloads/${eventName(type, subtype).replace('/', '.')}.json`;

describe('payload snapshots', () => {
  for (const event of events()) {
    it(eventName(event.type, event.subtype), async () => {
      const { last } = standalone(event.type, event.subtype);
      await expect(`${JSON.stringify(last, null, 2)}\n`).toMatchFileSnapshot(
        fileName(event.type, event.subtype),
      );
    });
  }
});

describe('signParts', () => {
  const chain = createTestChain();

  it('signs the transaction and renewal info into data, then the notification', () => {
    const { last } = standalone('DID_RENEW');
    const signed = signParts(last, chain);
    const outer = decodeJws(signed.signedPayload);
    const payload = outer.payload as typeof signed.notification;
    expect(Object.keys(payload.data ?? {})).toEqual([
      'bundleId',
      'bundleVersion',
      'environment',
      'signedTransactionInfo',
      'signedRenewalInfo',
      'status',
    ]);
    expect(decodeJws(payload.data?.signedTransactionInfo ?? '').payload).toEqual(last.transaction);
    expect(decodeJws(payload.data?.signedRenewalInfo ?? '').payload).toEqual(last.renewalInfo);
    expect(outer.x5c).toHaveLength(3);
  });

  it('signs the app transaction of RESCIND_CONSENT into appData', () => {
    const signed = signParts(standalone('RESCIND_CONSENT').last, chain);
    const payload = decodeJws(signed.signedPayload).payload as typeof signed.notification;
    expect(payload.data).toBeUndefined();
    expect(decodeJws(payload.appData?.signedAppTransactionInfo ?? '').payload).toMatchObject({
      receiptType: 'Sandbox',
      bundleId: 'com.example.app',
    });
  });

  it('carries no data for a summary and no signed fields for TEST', () => {
    const summary = signParts(standalone('RENEWAL_EXTENSION', 'SUMMARY').last, chain);
    expect(summary.notification.data).toBeUndefined();
    const test = signParts(standalone('TEST').last, chain);
    expect(test.notification.data).toEqual({
      bundleId: 'com.example.app',
      bundleVersion: '1',
      environment: 'Sandbox',
    });
  });
});
