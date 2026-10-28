# Troubleshooting

Each problem asnsim reports has a code and a link to its section here. The App Store's rules quoted
below are from Apple's
[Responding to App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications)
and [notificationUUID](https://developer.apple.com/documentation/appstoreservernotifications/notificationuuid)
pages, read on 28 October 2026.

## Nothing answered

`connection-failed`: asnsim could not open a connection to `--url`, or the URL is one `fetch`
refuses (such as port 9 or 6000, "bad port").

- Start the server and check the scheme, host, port and path of `--url`.
- A server in a container or a virtual machine must listen on an address the machine running asnsim
  can reach (`0.0.0.0` in the container, the published port outside).
- `localhost` can resolve to `::1` while the server listens on `127.0.0.1` only; try the address.

## No answer in time

`timeout`: the server accepted the connection but did not answer within `--timeout`
(10,000 ms by default).

- Answer once the notification is stored, and do slow work (emails, analytics, calls to other
  services) after answering.
- Raise `--timeout` when the server is slow only on this machine, such as on its first request.

## Redirects

`redirect`: the server answered 3xx. The App Store counts HTTP 200 to 206 as success and "all other
HTTP codes" as an unsuccessful post, so asnsim does not follow redirects either. Common causes:
`http` redirected to `https`, a missing or extra trailing slash, a login page. Give App Store
Connect, and `--url`, the final URL.

## Rejected

`rejected`: the server answered a status outside 200 to 206. The App Store would count the
delivery as failed and, in production, retry it five times, 1, 12, 24, 48 and 72 hours after the
previous attempt; in the sandbox it sends a notification once.

- **400 or 401 for every notification**: the verifier rejects them. See
  [Trust the test root](trust-the-test-root.md#3-send-notifications).
- **500 for one type**: the handler fails on it. `asnsim send <TYPE>` sends that type alone;
  `asnsim send --all` sends each of the 40 once.
- **A status for types you do not handle**: answer 200 for those too, or the App Store keeps
  retrying them.
- `--retries <n>` resends a failed notification unchanged, up to five times, to test a handler
  that fails only the first time.

`unexpected-status` is the same check against a step's `expect.status`, for scenarios that expect
a rejection on purpose.

## Duplicates

`duplicate-differs`: the same notification, sent again with `--duplicate` or `duplicate: true`,
got another answer than the first time. Apple gives each notification a `notificationUUID` to
"identify, and ignore, duplicate notifications". Store the UUIDs you have processed and answer a
repeated one with 200 without processing it again. A unique index that throws on the second insert
is the usual cause of a 500 here.

## Check failed

`check-failed`: the notification was delivered, and the step's check found another state than it
expects. `check-unreachable`: the check URL did not answer.

What Apple's notificationType page says each notification means for access, which is what checks
usually test:

| Notification                                                                                  | Access                                                       |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `SUBSCRIBED`, `DID_RENEW` (both subtypes), `ONE_TIME_CHARGE`, `RENEWAL_EXTENDED`, `*/UPGRADE` | given                                                        |
| `DID_FAIL_TO_RENEW/GRACE_PERIOD`                                                              | kept: "continue to provide service through the grace period" |
| `DID_FAIL_TO_RENEW` without subtype, `GRACE_PERIOD_EXPIRED`, `EXPIRED/*`                      | ended: the service can stop                                  |
| `REFUND`, `REVOKE`                                                                            | refunded or revoked                                          |
| `REFUND_REVERSED`                                                                             | reinstated: "reinstate them"                                 |
| everything else                                                                               | unchanged                                                    |

`asnsim types` prints the same for every pair.

## Decode problems

| Code                                                                                                                                                                  | Meaning and fix                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `untrusted-root`                                                                                                                                                      | The chain does not end in a trusted root. A payload from asnsim needs the test root: run decode where `.asnsim` is, or pass `--root`. A payload from Apple chains to Apple Root CA - G3, which decode trusts by default.                                                                                  |
| `bad-signature`                                                                                                                                                       | The payload or header changed after signing. Do not use its content.                                                                                                                                                                                                                                      |
| `not-valid-at-date`                                                                                                                                                   | Signed outside the certificates' validity. For an asnsim chain: `asnsim init --force`, then restart the backend.                                                                                                                                                                                          |
| `chain-length`                                                                                                                                                        | Not three certificates: not App Store data. Data from StoreKit Testing in Xcode has one certificate and `environment: Xcode`; `--environment Xcode` reads it without the check and reports `not-verified`.                                                                                                |
| `missing-signing-extension`, `missing-intermediate-extension`, `intermediate-not-ca`, `not-issued-by-intermediate`, `unreadable-certificate`, `unsupported-algorithm` | The chain is not one the App Store signs with.                                                                                                                                                                                                                                                            |
| `bundle-id-mismatch`, `environment-mismatch`                                                                                                                          | Another app or environment than `--bundle-id` and `--environment` say.                                                                                                                                                                                                                                    |
| `not-verified`                                                                                                                                                        | `--environment Xcode` skipped the checks, as Apple's verifier does for the Xcode environment: the data is readable but nothing proves where it came from. Use it only in tests.                                                                                                                           |
| `unread-jws`                                                                                                                                                          | A JWS-shaped value outside `data.signedTransactionInfo`, `data.signedRenewalInfo` and `data.signedAppTransactionInfo` (or `appData.…`), which asnsim does not decode: App Store data has none there. The report marks it "(JWS, not decoded)" and lists up to five paths; decode such a value on its own. |
| `deep-payload`                                                                                                                                                        | A payload with arrays or objects nested more than 64 levels deep. App Store payloads are a few levels deep, so it was not made by the App Store; asnsim shows a note instead of the payload.                                                                                                              |
