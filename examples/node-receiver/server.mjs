// Starts the example webhook on PORT (default 3000):
//
//   ASN_TEST_ROOT=.asnsim/root.cer node server.mjs
//
// POST /notifications receives App Store Server Notifications V2;
// GET /entitlements/<originalTransactionId> answers { "active": true | false, … }.
import { createReceiver, Environment, rootsFromEnvironment } from './receiver.mjs';

const port = Number(process.env.PORT ?? 3000);
const { server } = createReceiver({
  roots: rootsFromEnvironment(),
  environment:
    process.env.ASN_ENVIRONMENT === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX,
  bundleId: process.env.ASN_BUNDLE_ID ?? 'com.example.app',
  ...(process.env.ASN_APP_APPLE_ID ? { appAppleId: Number(process.env.ASN_APP_APPLE_ID) } : {}),
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Listening on http://127.0.0.1:${port}/notifications`);
});
