# Node.js receiver

A webhook for App Store Server Notifications V2 written on
[Apple's Node.js library](https://github.com/apple/app-store-server-library-node) 3.1.0, as a
backend would write it. It verifies each notification with `SignedDataVerifier`, keeps one
entitlement per `originalTransactionId`, ignores a `notificationUUID` it has already processed,
and answers `GET /entitlements/<originalTransactionId>` so a scenario can check it.

The one test-only part is the root it trusts ([receiver.mjs](receiver.mjs)):

```js
export function rootsFromEnvironment(env = process.env) {
  if (env.ASN_TEST_ROOT) {
    if (env.NODE_ENV === 'production') {
      throw new Error('ASN_TEST_ROOT is set in production: refusing to trust a test root.');
    }
    return [readFileSync(env.ASN_TEST_ROOT)];
  }
  return [readFileSync(env.APPLE_ROOT_CA ?? 'AppleRootCA-G3.cer')];
}
```

## Run it

From this folder, with asnsim installed:

```sh
npm install
asnsim init
ASN_TEST_ROOT=.asnsim/root.cer npm start
```

In a second terminal, in the same folder:

```sh
asnsim run scenarios/entitlements.yaml --url http://127.0.0.1:3000/notifications
asnsim run scenarios/refund-keeps-access.yaml --url http://127.0.0.1:3000/notifications
asnsim send --all --url http://127.0.0.1:3000/notifications
```

The first scenario passes: access stays on in Billing Grace Period, goes off when it ends, comes
back with billing recovery (sent twice, as a duplicate) and goes off after the refund. The second
fails on purpose, to show a failed check. The last line sends each of the 40 notification types.

In production, download Apple Root CA - G3 from
[apple.com/certificateauthority](https://www.apple.com/certificateauthority/) and start the server
without `ASN_TEST_ROOT`.
