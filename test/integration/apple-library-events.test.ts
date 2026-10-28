import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import { describe, expect, it } from 'vitest';
import { eventName, events } from '../../src/catalog.js';
import { createTestChain } from '../../src/pki/chain.js';
import { signParts } from '../../src/sim/payloads.js';
import { DEFAULT_APP } from '../../src/workspace.js';
import { simulation, standalone } from '../helpers/sim.js';

// Every notificationType and subtype asnsim writes, signed and handed to Apple's Node.js library
// as a backend would: the notification, then the transaction, renewal info and app transaction
// inside it. A field of the wrong type, a mismatched bundle ID or environment, or a date outside
// the chain fails here.

const chain = createTestChain();

const environments = [
  {
    name: 'Sandbox',
    app: DEFAULT_APP,
    verifier: new SignedDataVerifier(
      [Buffer.from(chain.root)],
      false,
      Environment.SANDBOX,
      DEFAULT_APP.bundleId,
    ),
  },
  {
    name: 'Production',
    app: { ...DEFAULT_APP, environment: 'Production' as const, appAppleId: 1234 },
    verifier: new SignedDataVerifier(
      [Buffer.from(chain.root)],
      false,
      Environment.PRODUCTION,
      DEFAULT_APP.bundleId,
      1234,
    ),
  },
];

describe.each(environments)('Apple SignedDataVerifier, $name', ({ app, verifier }) => {
  for (const event of events()) {
    it(eventName(event.type, event.subtype), async () => {
      const { last } = standalone(
        event.type,
        event.subtype,
        simulation({ app, start: new Date() }),
      );
      const signed = signParts(last, chain);
      const decoded = await verifier.verifyAndDecodeNotification(signed.signedPayload);
      expect(decoded.notificationType).toBe(event.type);
      expect(decoded.subtype ?? null).toBe(event.subtype);
      expect(decoded.notificationUUID).toBe(last.notification.notificationUUID);
      const data = signed.notification.data;
      if (data?.signedTransactionInfo) {
        const transaction = await verifier.verifyAndDecodeTransaction(data.signedTransactionInfo);
        expect(transaction).toEqual(last.transaction);
      }
      if (data?.signedRenewalInfo) {
        const renewal = await verifier.verifyAndDecodeRenewalInfo(data.signedRenewalInfo);
        expect(renewal).toEqual(last.renewalInfo);
      }
      const appTransaction = signed.notification.appData?.signedAppTransactionInfo;
      if (appTransaction) {
        expect(await verifier.verifyAndDecodeAppTransaction(appTransaction)).toEqual(
          last.appTransaction,
        );
      }
    });
  }
});
