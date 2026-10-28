import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CatalogError,
  catalog,
  eventName,
  events,
  findEvent,
  parseCatalog,
} from '../../src/catalog.js';

// The values Apple lists on its notificationType and subtype pages (read 28 October 2026). The
// catalog must hold exactly these: a type Apple adds fails this test until it is modelled.
const APPLE_TYPES = [
  'CONSUMPTION_REQUEST',
  'DID_CHANGE_RENEWAL_PREF',
  'DID_CHANGE_RENEWAL_STATUS',
  'DID_FAIL_TO_RENEW',
  'DID_RENEW',
  'EXPIRED',
  'EXTERNAL_PURCHASE_TOKEN',
  'GRACE_PERIOD_EXPIRED',
  'METADATA_UPDATE',
  'MIGRATION',
  'OFFER_REDEEMED',
  'ONE_TIME_CHARGE',
  'PRICE_CHANGE',
  'PRICE_INCREASE',
  'REFUND',
  'REFUND_DECLINED',
  'REFUND_REVERSED',
  'RENEWAL_EXTENDED',
  'RENEWAL_EXTENSION',
  'RESCIND_CONSENT',
  'REVOKE',
  'SUBSCRIBED',
  'TEST',
];
const APPLE_SUBTYPES = [
  'ACCEPTED',
  'ACTIVE_TOKEN_REMINDER',
  'AUTO_RENEW_DISABLED',
  'AUTO_RENEW_ENABLED',
  'BILLING_RECOVERY',
  'BILLING_RETRY',
  'CREATED',
  'DOWNGRADE',
  'FAILURE',
  'GRACE_PERIOD',
  'INITIAL_BUY',
  'PENDING',
  'PRICE_INCREASE',
  'PRODUCT_NOT_FOR_SALE',
  'RESUBSCRIBE',
  'SUMMARY',
  'UNREPORTED',
  'UPGRADE',
  'VOLUNTARY',
];

describe('catalog', () => {
  it('lists every notificationType and subtype Apple documents', () => {
    expect(
      catalog()
        .types.map((entry) => entry.type)
        .sort(),
    ).toEqual(APPLE_TYPES);
    const subtypes = new Set(events().flatMap((event) => (event.subtype ? [event.subtype] : [])));
    expect([...subtypes].sort()).toEqual(APPLE_SUBTYPES);
  });

  it('cites Apple’s pages and the date they were read', () => {
    const data = catalog();
    expect(data.readOn).toBe('2026-10-28');
    for (const url of Object.values(data.sources)) {
      expect(url).toMatch(
        /^https:\/\/developer\.apple\.com\/documentation\/appstoreservernotifications\//,
      );
    }
  });

  it('holds each pair once, with summary and access', () => {
    const names = events().map((event) => eventName(event.type, event.subtype));
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(40);
    for (const event of events()) expect(event.summary.length).toBeGreaterThan(20);
  });

  it('marks the payload object of each type as Apple describes it', () => {
    expect(findEvent('RENEWAL_EXTENSION', 'SUMMARY').payload).toBe('summary');
    expect(findEvent('RENEWAL_EXTENSION', 'FAILURE').payload).toBe('data');
    expect(findEvent('EXTERNAL_PURCHASE_TOKEN', 'CREATED').payload).toBe('externalPurchaseToken');
    expect(findEvent('RESCIND_CONSENT').payload).toBe('appData');
  });

  it('rejects a catalog that does not match the schema', () => {
    const json = JSON.parse(
      readFileSync(new URL('../../catalog/notifications.json', import.meta.url), 'utf8'),
    );
    expect(() => parseCatalog({ ...json, readOn: 'October' })).toThrow();
    expect(() => parseCatalog({ ...json, types: [{ ...json.types[0], events: [] }] })).toThrow();
  });
});

describe('findEvent', () => {
  it('finds pairs case-insensitively and picks the event without a subtype', () => {
    expect(eventName('DID_RENEW', null)).toBe('DID_RENEW');
    expect(findEvent('did_renew').subtype).toBeNull();
    expect(findEvent('REFUND').access).toBe('revoke');
    expect(findEvent('subscribed', 'initial_buy').access).toBe('grant');
    expect(findEvent('DID_FAIL_TO_RENEW', null).access).toBe('end');
  });

  it('names the choices when a type or subtype is wrong or missing', () => {
    expect(() => findEvent('RENEWED')).toThrow(CatalogError);
    expect(() => findEvent('RENEWED')).toThrow('Types: SUBSCRIBED, DID_RENEW');
    expect(() => findEvent('SUBSCRIBED')).toThrow(
      'SUBSCRIBED needs a subtype: INITIAL_BUY, RESUBSCRIBE.',
    );
    expect(() => findEvent('EXPIRED', 'UPGRADE')).toThrow(
      'EXPIRED has no subtype UPGRADE. Subtypes of EXPIRED: VOLUNTARY, BILLING_RETRY, PRICE_INCREASE, PRODUCT_NOT_FOR_SALE, (none).',
    );
    expect(() => findEvent('SUBSCRIBED', null)).toThrow('has no subtype (none)');
  });
});
