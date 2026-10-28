<!-- brand:start -->

<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/banner-light.svg" alt="asnsim: Signed App Store Server Notifications V2 on your machine: renewals, refunds and grace periods sent to your webhook."></picture></p>

<!-- lang-selector:start -->
<p align="center"><a href="README.md">English</a> · <a href="README.tr.md">Türkçe</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.ru.md">Русский</a></p>
<!-- lang-selector:end -->

<p align="center">
<a href="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml"><img src="https://github.com/muhittincamdali/asnsim/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
<a href="https://github.com/muhittincamdali/asnsim/releases"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-version-light.svg" alt="Latest version: v0.1.2"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/package.json"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-language-light.svg" alt="Language version: Node.js 22.12+"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/blob/main/LICENSE"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/badge-license-light.svg" alt="License: MIT"></picture></a>
</p>

<p align="center">
<a href="#quick-start"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-en-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-en-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-start-en-light.svg" alt="Get started"></picture></a>
<a href="https://muhittincamdali.github.io/asnsim/"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-en-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-en-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-docs-en-light.svg" alt="Documentation"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/docs/guides"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-en-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-en-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-guides-en-light.svg" alt="Guides"></picture></a>
<a href="https://github.com/muhittincamdali/asnsim/tree/main/examples"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-en-dark.svg"><source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-en-light.svg"><img src="https://raw.githubusercontent.com/muhittincamdali/asnsim/main/.github/brand/button-examples-en-light.svg" alt="Examples"></picture></a>
</p>

<!-- brand:end -->

Apple's Request a Test Notification endpoint sends only the `TEST` type, and its sandbox sends each
App Store Server Notification once, without the retries of production. asnsim sends every notification type and subtype Apple documents (40
pairs, read on 28 October 2026, including the `ASSIGNED` and `ASSIGNMENT_REVOKE` values Apple
made available in production on 23 October 2026), signed the way the App Store signs them, to your
webhook from your own machine. Your backend keeps Apple's own verification code and trusts asnsim's
test root only in its tests.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/media/demo-checks-dark.svg"><source media="(prefers-color-scheme: light)" srcset="docs/media/demo-checks-light.svg"><img src="docs/media/demo-checks-light.svg" alt="asnsim run scenarios/entitlements.yaml: five notifications to a webhook built on Apple's Node.js library, each answered 200 and followed by a check of the customer's entitlement; 5 of 5 notifications passed, 11 requests"></picture>

<sub>Recorded from the real CLI against <a href="examples/node-receiver">examples/node-receiver</a>,
a webhook on Apple's Node.js library (<code>npm run demo</code>).</sub>

## Highlights

- **All 40 notifications, consistent.** `SUBSCRIBED`, `DID_RENEW`, `DID_FAIL_TO_RENEW` with and
  without Billing Grace Period, `EXPIRED` for each reason, upgrades, downgrades, price increases,
  refunds and their reversal, Family Sharing and organization revocations, consumption requests,
  renewal extensions, external purchase tokens, `RESCIND_CONSENT` and the Advanced Commerce
  types. One customer's transaction IDs, dates and renewal info stay consistent from step to step.
- **Verified by Apple's libraries.** The tests hand every notification to `SignedDataVerifier`
  from Apple's Node.js library 3.1.0, in Sandbox and Production; Apple's Swift library 6.0.0
  verified all 40 on a Mac (Apple silicon) with Swift 6.4.
- **Scenarios with checks.** A YAML file of steps, each followed by an optional request that checks
  what your backend did: "after `REFUND`, `GET /entitlements/{originalTransactionId}` says
  `active: false`". Nine scenarios are built in.
- **The App Store's delivery rules.** 200 to 206 is success, anything else (redirects included) a
  failed delivery; `--retries` resends unchanged as production does, `--duplicate` sends each
  notification twice to test that your server ignores a repeated `notificationUUID`.
- **A decoder for the real thing.** `asnsim decode` reads a notification body, a signed transaction
  or an App Store Server API response, decodes every JWS inside and checks it against Apple Root
  CA - G3 the way Apple's libraries do, offline. It reads StoreKit Testing data from Xcode too.
- **Made for CI.** Terminal, text, Markdown and JSON reports; exit code 0 passed, 1 a delivery,
  check or verification failed, 2 usage error. Reports hide URL credentials, query values, IDs and
  secrets in webhook answers ([what they hide](docs/guides/ci.md#what-the-reports-hide)).

## Quick start

**1. Install asnsim.** With [Homebrew](https://brew.sh/), which also installs Node.js:

```sh
brew install muhittincamdali/tap/asnsim
```

Or with npm from the
[GitHub release](https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.2), which needs
[Node.js](https://nodejs.org/) 22.12 or later (`node --version` prints it):

```sh
npm i -g https://github.com/muhittincamdali/asnsim/releases/download/v0.1.2/asnsim-0.1.2.tgz
```

The package is not on the npm registry yet; publishing it there as `@mcamdali/asnsim` is planned.
Both commands install the same release tarball.

**2. Create the test chain, then let your backend trust it in tests.** In your project's folder:

```sh
asnsim init --bundle-id com.example.app
```

This writes `.asnsim/`. In the test configuration of your backend, give Apple's
`SignedDataVerifier` the file `.asnsim/root.cer` as its root certificate, with online checks off,
and start the backend. [Trust the test root](docs/guides/trust-the-test-root.md) shows the lines
for Node.js, Swift, Java and Python.

**3. Send notifications to your webhook:**

```sh
asnsim run trial-renew-refund --url http://localhost:3000/notifications
```

Every line ends in `ok` when your server answered the way the App Store expects. A `failed` line
says what happened and how to fix it; [Troubleshooting](docs/guides/troubleshooting.md) has the
details.

## What asnsim sends

The POST body is the one the App Store sends, `{"signedPayload": "…"}`. The JWS is signed with
ES256 by a three-certificate chain with the two Apple extensions Apple's verifiers check for;
every certificate name says `asnsim (not Apple)`. Inside are the transaction and renewal info,
signed the same way, with the fields of Apple's
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
and [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload).

| Family                     | Notifications                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Purchase and renewal       | `SUBSCRIBED/INITIAL_BUY`, `SUBSCRIBED/RESUBSCRIBE`, `DID_RENEW`, `DID_RENEW/BILLING_RECOVERY`, `ONE_TIME_CHARGE`       |
| Billing problems           | `DID_FAIL_TO_RENEW`, `DID_FAIL_TO_RENEW/GRACE_PERIOD`, `GRACE_PERIOD_EXPIRED`                                          |
| Expiry                     | `EXPIRED` with `VOLUNTARY`, `BILLING_RETRY`, `PRICE_INCREASE`, `PRODUCT_NOT_FOR_SALE` or no subtype                   |
| Changes by the customer    | `DID_CHANGE_RENEWAL_STATUS` (3), `DID_CHANGE_RENEWAL_PREF` (3), `OFFER_REDEEMED` (3), `PRICE_INCREASE` (2)            |
| Refunds and revocation     | `REFUND`, `REFUND_DECLINED`, `REFUND_REVERSED`, `CONSUMPTION_REQUEST`, `REVOKE`                                        |
| Requests of the developer  | `RENEWAL_EXTENDED`, `RENEWAL_EXTENSION/SUMMARY`, `RENEWAL_EXTENSION/FAILURE`, `TEST`                                   |
| Other payloads             | `EXTERNAL_PURCHASE_TOKEN` (3), `RESCIND_CONSENT`; Advanced Commerce `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE`     |

`asnsim types` prints each pair with what Apple says it means for access. The data behind it is
[catalog/notifications.json](catalog/notifications.json), and the tests compare it with the values
Apple's pages listed when they were read on 28 October 2026, kept as a copy in the test; a type or
subtype Apple adds later shows up once that copy is updated, not on its own. [What asnsim sends](docs/guides/notifications.md) lists the fields
each notification changes, and which values asnsim chooses where Apple's pages give none.

## Usage

```text
asnsim init        write the test chain and the app settings to .asnsim/
asnsim run         send the notifications of a scenario (built-in or a .yaml/.json file)
asnsim send        send one notification after the history it needs; --all sends each of the 40
asnsim payload     print the request body of one notification without sending it
asnsim decode      decode and verify a notification body, signedPayload or signed transaction
asnsim types       list the notification types and subtypes
asnsim scenarios   list the built-in scenarios
```

| Option (run, send)       | What it does                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `-u, --url <url>`        | The webhook                                                                          |
| `-d, --dir <folder>`     | The folder `asnsim init` wrote, default `.asnsim`                                    |
| `--clock live\|fixed`    | Date each notification when sent (default), or with the scenario's own dates         |
| `--start <date>`         | Date of the first event; makes the clock fixed                                       |
| `--seed <text>`          | The same transaction IDs and notificationUUIDs on every run                          |
| `--retries <n>`          | Resend a failed notification unchanged, up to 5 times                                |
| `--duplicate`            | Send every notification twice                                                        |
| `--timeout <ms>`         | Time limit per request, default 10000                                                |
| `-H, --header <header>`  | Extra request header for the webhook and its checks, repeatable                      |
| `--out <folder>`         | Also write each request body to a file                                               |
| `--dry-run`              | Sign and write, send nothing                                                         |
| `-f, --format <format>`  | `tty` (default), `text`, `markdown` or `json`; `--json` is short for the last        |
| `-o, --output <file>`    | Write the report to a file                                                           |

Exit codes: `0` every notification passed (answered 200 to 206, or the step's `expect`, and its
check matched), `1` a delivery, expectation or check failed, `2` bad arguments, no test chain, a
scenario that does not load, or an unexpected error. `asnsim decode` exits 1 when a JWS does not
verify.

### Send one notification

```sh
asnsim send DID_FAIL_TO_RENEW GRACE_PERIOD --url http://localhost:3000/notifications
asnsim send REFUND --product com.example.coins.100 --url http://localhost:3000/notifications
asnsim send --all --url http://localhost:3000/notifications
```

`send` plays, unsent, the history the notification needs (a subscription and a failed renewal
before `BILLING_RECOVERY`, a purchase before a refund), so its IDs and dates are consistent.
`--all` sends each of the 40 once: a quick way to see that no type makes your handler fail.

### Write a scenario

```yaml
description: Access follows the subscription.
steps:
  - type: SUBSCRIBED
    subtype: INITIAL_BUY
    offer: { type: introductory, discount: FREE_TRIAL, period: P1W }
    check: { url: "/entitlements/{originalTransactionId}", json: { active: true } }
  - type: DID_FAIL_TO_RENEW
    subtype: GRACE_PERIOD
    check: { url: "/entitlements/{originalTransactionId}", json: { active: true } }
  - type: REFUND
    duplicate: true
    check: { url: "/entitlements/{originalTransactionId}", json: { active: false } }
```

Each step happens where the event would (a renewal at the end of the period, an expiry 60 days
into billing retry) unless `after` or `at` moves it. [Write a scenario](docs/guides/scenarios.md)
describes every key.

| Built-in scenario              | Steps                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `trial-renew-refund`           | free trial, first renewal, refund                                                                      |
| `billing-retry-grace-recovery` | renewal, failed renewal in Billing Grace Period, grace period over, billing recovery                   |
| `billing-retry-expired`        | failed renewal, expiry after 60 days of retry                                                          |
| `cancel-expire-winback`        | auto-renew off, voluntary expiry, resubscription with a win-back offer                                 |
| `upgrade-downgrade`            | upgrade now, downgrade at the next renewal                                                             |
| `price-increase-accepted`      | price increase pending, accepted, renewal at the new price                                             |
| `price-increase-declined`      | price increase pending, expiry                                                                         |
| `consumable-refund-dispute`    | consumable, consumption request, refund, refund reversed                                               |
| `family-sharing-revoke`        | access through Family Sharing, then revoked                                                            |

### Decode what the App Store sent

```sh
asnsim decode notification.json
pbpaste | asnsim decode -
```

decode checks each JWS the way Apple's `SignedDataVerifier` does with online checks off: three
certificates, each issued by the next, Apple's two extensions, validity at `signedDate`, the
ES256 signature, against Apple Root CA - G3 (built in), the test root in `.asnsim` and any
`--root`. Revocation needs Apple's OCSP server and is not checked. Data from StoreKit Testing in
Xcode is signed by Xcode and does not verify; `--environment Xcode` prints it without the check and
reports it as not verified, as Apple's verifier skips the check only when it is set up for Xcode.
[Decode what the App Store sent](docs/guides/decode.md) has the details.

### From JavaScript

```js
import { loadScenario, loadWorkspace, runScenario } from '@mcamdali/asnsim';

const result = await runScenario(loadScenario('trial-renew-refund'), {
  workspace: loadWorkspace('.asnsim'),
  url: 'http://localhost:3000/notifications',
});
console.log(result.ok, result.counts);
```

## Checked against Apple's libraries

| Check                                                                                               | Where                                                                       |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Every notification of the 40, its transaction, renewal info and app transaction, verified by Apple's Node.js library 3.1.0 in Sandbox and in Production | [test/integration/apple-library-events.test.ts](test/integration/apple-library-events.test.ts), `npm test` |
| A webhook on Apple's Node.js library passes the entitlement scenario and answers all 40 types with 200 | [test/integration/examples.test.ts](test/integration/examples.test.ts), `npm test`                          |
| All 40 bodies verified by Apple's Swift library 6.0.0                                               | [Examples workflow](.github/workflows/examples.yml); on 28 October 2026 on a Mac (Apple silicon, M5 Max) with Swift 6.4 |
| Apple's real chain (Apple Root CA - G3, WWDR G6, the 2025 receipt signing certificate) passes decode's chain checks | [test/unit/verify.test.ts](test/unit/verify.test.ts)                          |
| A transaction and renewal info from StoreKit Testing (Xcode 27.1, iOS 27.0 Simulator) decode          | [test/data/xcode](test/data/xcode)                                          |

The suite has 708 tests in 26 files (unit, integration, snapshot and end-to-end), all passing with
`npm test` on 28 October 2026 on a Mac (Apple silicon) with Node.js 26.

## Demo

| Recording                                                                          | Light · dark                                                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `asnsim init`                                                                      | [light](docs/media/demo-init-light.svg) · [dark](docs/media/demo-init-dark.svg)                   |
| The entitlement scenario with a check after each step (top of this page)           | [light](docs/media/demo-checks-light.svg) · [dark](docs/media/demo-checks-dark.svg)               |
| `trial-renew-refund` with `--duplicate`                                            | [light](docs/media/demo-trial-light.svg) · [dark](docs/media/demo-trial-dark.svg)                 |
| A check that fails, with its fix                                                   | [light](docs/media/demo-failure-light.svg) · [dark](docs/media/demo-failure-dark.svg)             |
| `asnsim decode` on a transaction StoreKit Testing signed                           | [light](docs/media/demo-decode-xcode-light.svg) · [dark](docs/media/demo-decode-xcode-dark.svg)   |

Measured on 28 October 2026 on a Mac (Apple silicon, M5 Max) with Node.js 26.12.1, seven runs
each, Node.js start-up included: `asnsim send --all` against examples/node-receiver (40
notifications, each verified by Apple's library in the receiver) took 0.17 to 0.20 seconds,
median 0.18; the same with `--dry-run` 0.13 to 0.14 seconds. Other work kept the machine's load average near 11 (18 cores) during the runs.

## Status

| Feature                                                                                              | Status        |
| ---------------------------------------------------------------------------------------------------- | ------------- |
| Test chain, signing, the 40 notification pairs, Sandbox and Production                               | works         |
| Scenarios with checks, duplicates, retries, live and fixed clocks; nine built-in scenarios           | works         |
| decode with Apple Root CA - G3, test roots and StoreKit Testing data                                 | works         |
| Terminal, text, Markdown and JSON reports; exit codes                                                | works         |
| `billingPlanType`, `commitmentInfo`, `eligibleWinBackOfferIds`, `advancedCommerceInfo` fields          | planned (0.2) |
| Several customers and subscription groups in one scenario                                           | planned (0.2) |
| Out-of-order delivery and the production retry schedule in real time                                | planned (0.3) |
| App Store Server API mock (Get Transaction History, Get All Subscription Statuses)                   | planned (0.4) |
| Stable scenario format and JSON layout                                                               | planned (1.0) |

## Limits

- **Simulated, not captured.** The payloads follow Apple's field definitions and its descriptions of
  each notification; they are not copies of what Apple's servers send. Where Apple's pages give no
  value (transaction ID formats, grace period length, the storefront), asnsim picks one, listed in
  [What asnsim sends](docs/guides/notifications.md#choices-asnsim-makes), and every value can be
  changed per step with `set`.
- **A test root, not Apple's.** Nothing asnsim signs verifies against Apple Root CA - G3. A backend
  must trust `.asnsim/root.cer` in its tests, and must never trust it in production.
- **Online checks off.** Apple's verifiers check revocation with Apple's OCSP server when online
  checks are on; the test chain has no OCSP server, so tests run with them off.
- **One customer per scenario,** with one subscription group and any one-time purchases.
- **Bounded input.** Scenario files up to 1 MB and 500 steps, decode input up to 2 MB, a JWS up to
  1,000,000 characters, certificates nested at most 32 levels, and the first 64 KB of each answer. Decode input and `--root` files are read as a stream and refused at the first byte past 2 MB: `asnsim decode /dev/zero` stops in 0.10 to 0.13 seconds at 72 MB of memory (Mac (Apple silicon), Node.js 26).

## Documentation

API reference and guides: [muhittincamdali.github.io/asnsim](https://muhittincamdali.github.io/asnsim/).

## Guides

- [Trust the test root in your backend's tests](docs/guides/trust-the-test-root.md)
- [Write a scenario](docs/guides/scenarios.md)
- [What asnsim sends for each notification](docs/guides/notifications.md)
- [Decode what the App Store sent](docs/guides/decode.md)
- [Run asnsim in CI](docs/guides/ci.md)
- [Troubleshooting](docs/guides/troubleshooting.md)

## Sources

Read on 28 October 2026:

- Apple, App Store Server Notifications:
  [notificationType](https://developer.apple.com/documentation/appstoreservernotifications/notificationtype),
  [subtype](https://developer.apple.com/documentation/appstoreservernotifications/subtype),
  [responseBodyV2DecodedPayload](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload),
  [data](https://developer.apple.com/documentation/appstoreservernotifications/data),
  [summary](https://developer.apple.com/documentation/appstoreservernotifications/summary),
  [externalPurchaseToken](https://developer.apple.com/documentation/appstoreservernotifications/externalpurchasetoken),
  [appData](https://developer.apple.com/documentation/appstoreservernotifications/appdata),
  [status](https://developer.apple.com/documentation/appstoreservernotifications/status),
  [notificationUUID](https://developer.apple.com/documentation/appstoreservernotifications/notificationuuid),
  [JWSDecodedHeader](https://developer.apple.com/documentation/appstoreservernotifications/jwsdecodedheader),
  [Responding to App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications),
  [Enabling App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/enabling-app-store-server-notifications),
  [changelog](https://developer.apple.com/documentation/appstoreservernotifications/app-store-server-notifications-changelog).
- Apple, App Store Server API:
  [JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload),
  [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload),
  [JWSAppTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsapptransactiondecodedpayload),
  [Request a Test Notification](https://developer.apple.com/documentation/appstoreserverapi/request-a-test-notification),
  and the value pages linked from them (expirationIntent, revocationReason, revocationType,
  offerType, offerDiscountType, transactionReason, autoRenewStatus, priceIncreaseStatus).
- Apple PKI: [Apple Root CA - G3 and WWDR G6](https://www.apple.com/certificateauthority/).
- Apple's App Store Server Libraries for
  [Node.js](https://github.com/apple/app-store-server-library-node) (3.1.0),
  [Swift](https://github.com/apple/app-store-server-library-swift) (6.0.0),
  [Java](https://github.com/apple/app-store-server-library-java) and
  [Python](https://github.com/apple/app-store-server-library-python): the checks of
  `SignedDataVerifier`.
- IETF [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) (JWS) and
  [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280) (X.509).

## Requirements

Node.js 22.12 or later on macOS, Linux or Windows. Nothing else: no Xcode, no Apple account, no
network beyond your webhook. The Swift example needs Swift 6.4: its
Package.resolved pins swift-collections 1.7.5, which needs Swift tools 6.4.

## Architecture

```text
catalog/notifications.json   40 type and subtype pairs, payload object, access, Apple's pages
  ─► Simulation              one customer: subscription state, virtual clock, seeded IDs
  ─► buildParts / signParts  transaction, renewal info, data / summary / appData, ES256 JWS
       pki/                  DER writer and reader, the test chain, Apple's verifier checks
  ─► runScenario / send      POST {"signedPayload"}, the App Store's 200–206 rule, retries,
                             duplicates, checks, findings with fixes
  ─► render                  tty | text | markdown | json
decode                       find the token, decode nested JWS, verify against trusted roots
```

- The notification data is separate from the code and checked against Apple's pages by the tests.
- The CLI (`src/cli/`) only parses arguments, picks colours and widths, and sets the exit code.
- No dependency signs or parses certificates: asnsim writes and reads the DER itself, and Node.js
  `crypto` signs.

## Related

[glassready](https://github.com/muhittincamdali/glassready) shows what Liquid Glass changes in an
app built with the iOS 27 SDK, and [a11ylabel](https://github.com/muhittincamdali/a11ylabel) which
App Store accessibility labels it can claim. asnsim tests what the backend behind its purchases
does.

## FAQ

**Does this replace testing in the sandbox?** No. The sandbox tests the real App Store and your App
Store Connect configuration; asnsim tests your backend's handling of every notification, as often
as you like, before and between sandbox runs.

**Can a notification from asnsim reach a production server?** Only if that server trusts the test
root. A server that trusts only Apple Root CA - G3 rejects every asnsim notification, as the tests
check.

**Do I need Flutter- or React Native-specific setup?** No. Notifications go from the App Store to
your server whatever the app is written in; the backend that handles them is what asnsim tests.

## Contributing

Contributions are welcome: read [CONTRIBUTING.md](CONTRIBUTING.md) and the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) before
opening a pull request, and report security issues as described in [SECURITY.md](SECURITY.md).

## License

Released under the MIT license. See [LICENSE](LICENSE).
