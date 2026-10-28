# Trust the test root in your backend's tests

asnsim signs notifications with a certificate chain it creates on your machine. Your backend checks
every notification with a `SignedDataVerifier` from Apple's App Store Server Library, and that
verifier only accepts data whose chain ends in a root you give it. In production that root is
Apple Root CA - G3. In tests it is the asnsim root, `.asnsim/root.cer`. That is the only change
your backend needs.

## 1. Create the test chain

```sh
asnsim init --bundle-id com.example.app
```

`init` writes `.asnsim/`:

| File                                          | What it is                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `root.cer`                                    | The test root in DER, the form Apple's libraries read. Give this to the verifier. |
| `root.pem`, `intermediate.pem`, `signing.pem` | The three certificates in PEM                                                     |
| `signing-key.pem`                             | The private key asnsim signs with (mode 0600)                                     |
| `asnsim.json`                                 | Bundle ID, bundle version, environment and app Apple ID of the notifications      |
| `.gitignore`                                  | `*`: the folder stays out of git                                                  |

The chain has the shape Apple's verifiers check: three certificates, an intermediate with the
Worldwide Developer Relations extension (`1.2.840.113635.100.6.2.1`) and a signing certificate with
the receipt signing extension (`1.2.840.113635.100.6.11.1`). Every name in it says
`asnsim (not Apple)`. The keys of the root and the intermediate are thrown away once the chain is
made, so the root cannot vouch for any other key.

For a Production test, give the app Apple ID too: Apple's verifier requires it there.

```sh
asnsim init --environment Production --app-apple-id 1234567890
```

## 2. Give the verifier the test root, in tests only

Three settings must match `.asnsim/asnsim.json`: the root, the bundle ID and the environment.
Online checks must be off. They check revocation with Apple's OCSP server, which knows nothing of
the test chain. With online checks off, Apple's libraries check the certificates' dates at the
notification's `signedDate`.

Choose the root in one place, and refuse a test root in production:

### Node.js (`@apple/app-store-server-library`)

```js
import { readFileSync } from 'node:fs';
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';

function roots() {
  if (process.env.ASN_TEST_ROOT) {
    if (process.env.NODE_ENV === 'production') throw new Error('Test root in production');
    return [readFileSync(process.env.ASN_TEST_ROOT)]; // .asnsim/root.cer
  }
  return [readFileSync('certs/AppleRootCA-G3.cer')];
}

const verifier = new SignedDataVerifier(
  roots(),
  !process.env.ASN_TEST_ROOT, // online checks only with Apple's root
  Environment.SANDBOX,
  'com.example.app',
);
```

[examples/node-receiver](https://github.com/muhittincamdali/asnsim/tree/main/examples/node-receiver) is a complete webhook built this way, and
asnsim's tests run it.

### Swift (`app-store-server-library-swift`)

```swift
let root = try Data(contentsOf: URL(fileURLWithPath: ".asnsim/root.cer"))
let verifier = try SignedDataVerifier(
  rootCertificates: [root], bundleId: "com.example.app", appAppleId: nil,
  environment: .sandbox, enableOnlineChecks: false)
```

[examples/swift-verifier](https://github.com/muhittincamdali/asnsim/tree/main/examples/swift-verifier) verifies the bodies asnsim writes with
library 6.0.0.

### Java and Python

The constructors take the same values; their order, from each library's README:

```java
new SignedDataVerifier(Set.of(new FileInputStream(".asnsim/root.cer")), "com.example.app", null, Environment.SANDBOX, false);
```

```python
SignedDataVerifier([open(".asnsim/root.cer", "rb").read()], False, Environment.SANDBOX, "com.example.app", None)
```

asnsim's tests run the Node.js and Swift libraries; the Java and Python lines follow the libraries'
READMEs and have not been run by asnsim's tests.

## 3. Send notifications

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

When the backend answers 400 to everything, its verifier rejects the notifications. The usual
reasons, in order:

1. The verifier still has only Apple's root. Check that the test configuration loads
   `.asnsim/root.cer`.
2. The bundle ID or environment differs from `.asnsim/asnsim.json`. `asnsim decode` on one of the
   bodies (`--dry-run --out bodies`) shows them.
3. Online checks are on.
4. The chain was made again (`asnsim init --force`) after the backend loaded the old root. Restart
   it.

## Why a test root and not a mock

The backend runs the same verification code in tests as in production, and only the trusted root
differs. A mock verifier would skip the checks that most often fail in production: a bundle ID
from another target, a Sandbox notification sent to the Production verifier, an expired chain.
