// A webhook for App Store Server Notifications V2 built on Apple's Node.js library, the way a
// backend would write one, with one change for tests: which root certificates it trusts.
//
// - In production it trusts Apple Root CA - G3 (downloaded from apple.com) and nothing else.
// - In tests it trusts the asnsim test root, .asnsim/root.cer, so asnsim's notifications verify.
//
// It keeps one entitlement per originalTransactionId in memory and ignores a notification it has
// already processed, by notificationUUID.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';

/** What each notification means for access, from Apple's notificationType page. */
const GRANT = new Set([
  'SUBSCRIBED',
  'DID_RENEW',
  'ONE_TIME_CHARGE',
  'RENEWAL_EXTENDED',
  'REFUND_REVERSED',
]);
const END = new Set(['EXPIRED', 'GRACE_PERIOD_EXPIRED', 'REFUND', 'REVOKE']);

function accessAfter(notification) {
  const { notificationType: type, subtype } = notification;
  if (GRANT.has(type)) return true;
  if (type === 'DID_CHANGE_RENEWAL_PREF' && subtype === 'UPGRADE') return true;
  // Billing Grace Period: Apple asks that the service continue.
  if (type === 'DID_FAIL_TO_RENEW') return subtype === 'GRACE_PERIOD';
  if (END.has(type)) return false;
  return undefined;
}

/**
 * @param {{ roots: Buffer[], environment: string, bundleId: string, appAppleId?: number }} options
 */
export function createReceiver({ roots, environment, bundleId, appAppleId }) {
  const verifier = new SignedDataVerifier(roots, false, environment, bundleId, appAppleId);
  const entitlements = new Map();
  const processed = new Set();

  async function handleNotification(body) {
    const { signedPayload } = JSON.parse(body);
    const notification = await verifier.verifyAndDecodeNotification(signedPayload);
    if (processed.has(notification.notificationUUID)) return 'duplicate';
    const signed = notification.data?.signedTransactionInfo;
    if (signed) {
      const transaction = await verifier.verifyAndDecodeTransaction(signed);
      const active = accessAfter(notification);
      const id = transaction.originalTransactionId;
      const previous = entitlements.get(id);
      entitlements.set(id, {
        active: active ?? previous?.active ?? false,
        productId: transaction.productId,
        expiresDate: transaction.expiresDate ?? null,
        lastNotification: [notification.notificationType, notification.subtype]
          .filter(Boolean)
          .join('/'),
      });
    }
    processed.add(notification.notificationUUID);
    return 'processed';
  }

  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    if (request.method === 'POST' && request.url === '/notifications') {
      try {
        await handleNotification(body);
        response.writeHead(200).end();
      } catch (error) {
        // A payload that does not verify is answered 400; the App Store would retry it.
        response.writeHead(400, { 'content-type': 'text/plain' }).end(`${error?.status ?? error}`);
      }
      return;
    }
    const match = /^\/entitlements\/([^/]+)$/.exec(request.url ?? '');
    if (request.method === 'GET' && match) {
      const entitlement = entitlements.get(decodeURIComponent(match[1])) ?? { active: false };
      response
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify(entitlement));
      return;
    }
    response.writeHead(404).end();
  });
  return { server, entitlements };
}

/** The roots for this run: the asnsim test root when ASN_TEST_ROOT names it, else Apple's. */
export function rootsFromEnvironment(env = process.env) {
  if (env.ASN_TEST_ROOT) {
    if (env.NODE_ENV === 'production') {
      throw new Error('ASN_TEST_ROOT is set in production: refusing to trust a test root.');
    }
    return [readFileSync(env.ASN_TEST_ROOT)];
  }
  return [readFileSync(env.APPLE_ROOT_CA ?? 'AppleRootCA-G3.cer')];
}

export { Environment };
