# What asnsim sends for each notification

asnsim writes every `notificationType` and `subtype` on Apple's pages (read 28 October 2026): 23
types, 40 pairs. The JSON follows the field definitions of
[responseBodyV2DecodedPayload](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2decodedpayload),
[JWSTransactionDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwstransactiondecodedpayload)
and [JWSRenewalInfoDecodedPayload](https://developer.apple.com/documentation/appstoreserverapi/jwsrenewalinfodecodedpayload).
The values come from asnsim's simulation, not from Apple's servers: where Apple's pages say what
a field holds after an event, asnsim writes that; the choices asnsim makes on its own are listed at
the end. The decoded payload of every pair is in
[test/**snapshots**/payloads](https://github.com/muhittincamdali/asnsim/tree/main/test/__snapshots__/payloads).

## The envelope

- The POST body is `{"signedPayload": "…"}` with `Content-Type: application/json`, the
  [responseBodyV2](https://developer.apple.com/documentation/appstoreservernotifications/responsebodyv2)
  object.
- `signedPayload` is a JWS signed with ES256; its header's `x5c` holds the signing certificate,
  the intermediate and the root.
- The payload has `notificationType`, `subtype` when there is one, `notificationUUID`, one of
  `data`, `summary`, `externalPurchaseToken` or `appData`, `version: "2.0"` and `signedDate`.
- `data` has `bundleId`, `bundleVersion`, `environment`, the signed transaction and, for
  auto-renewable subscriptions, the signed renewal info and `status`. `appAppleId` is written in
  Production only: Apple's page says it "isn't present in the sandbox environment".

## Per type

| Notification                                   | What changes                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUBSCRIBED/INITIAL_BUY`                       | A new original transaction; with an introductory offer, `offerType` 1 and its discount and period                                                 |
| `SUBSCRIBED/RESUBSCRIBE`                       | A new transaction with the same `originalTransactionId`; `recentSubscriptionStartDate` moves only after a lapse of more than 60 days              |
| `DID_RENEW`                                    | A new transaction (`transactionReason` RENEWAL) starting at the end of the period; a pending downgrade or an accepted price increase takes effect |
| `DID_RENEW/BILLING_RECOVERY`                   | A new period from the recovery; billing retry and grace fields cleared; `status` 1                                                                |
| `DID_FAIL_TO_RENEW[/GRACE_PERIOD]`             | `isInBillingRetryPeriod` true, `expirationIntent` 2; with the subtype, `gracePeriodExpiresDate` and `status` 4, without it `status` 3             |
| `GRACE_PERIOD_EXPIRED`                         | `gracePeriodExpiresDate` cleared; `status` 3                                                                                                      |
| `EXPIRED/*`                                    | `status` 2; `expirationIntent` 1 VOLUNTARY, 2 BILLING_RETRY, 3 PRICE_INCREASE, 4 PRODUCT_NOT_FOR_SALE, 5 none                                     |
| `DID_CHANGE_RENEWAL_STATUS/*`                  | `autoRenewStatus` 0 or 1                                                                                                                          |
| `DID_CHANGE_RENEWAL_PREF/UPGRADE`              | A new transaction for the higher level (`transactionReason` PURCHASE) starting now; the old one marked `isUpgraded`                               |
| `DID_CHANGE_RENEWAL_PREF/DOWNGRADE`            | `autoRenewProductId` and `renewalPrice` of the lower level; the transaction unchanged until the renewal                                           |
| `OFFER_REDEEMED[/…]`                           | The offer on the renewal info (`offerType` 2 by default), or with UPGRADE on the new transaction                                                  |
| `PRICE_INCREASE/PENDING`, `ACCEPTED`           | `priceIncreaseStatus` 0 or 1 and the new `renewalPrice` (20% more unless `price` is given)                                                        |
| `REFUND`                                       | `revocationDate`, `revocationReason`, `revocationType` REFUND_FULL or REFUND_PRORATED, `revocationPercentage`; `status` 5                         |
| `REFUND_REVERSED`                              | The revocation fields removed; `status` back to 1 (or 2 when the period has ended)                                                                |
| `REVOKE`                                       | `inAppOwnershipType` FAMILY_SHARED (or ASSIGNED) with `revocationType` FAMILY_REVOKE (or ASSIGNMENT_REVOKE), `revocationReason` 0                 |
| `CONSUMPTION_REQUEST`                          | `data.consumptionRequestReason`                                                                                                                   |
| `RENEWAL_EXTENDED`                             | `expiresDate` and `renewalDate` moved by `extendBy`                                                                                               |
| `RENEWAL_EXTENSION/SUMMARY`                    | `summary` instead of `data`: `requestIdentifier`, `productId`, `succeededCount` 1, `failedCount` 0                                                |
| `ONE_TIME_CHARGE`                              | A consumable, non-consumable or non-renewing transaction; no renewal info, no `status`                                                            |
| `TEST`                                         | `data` with the app fields only                                                                                                                   |
| `EXTERNAL_PURCHASE_TOKEN/*`                    | `externalPurchaseToken`; in Sandbox the ID starts with `SANDBOX`, the prefix Apple's Node.js library reads as Sandbox                             |
| `RESCIND_CONSENT`                              | `appData` with a signed app transaction                                                                                                           |
| `METADATA_UPDATE`, `MIGRATION`, `PRICE_CHANGE` | The Advanced Commerce types, with the subscription's data; `advancedCommerceInfo` is not written (planned)                                        |

## Choices asnsim makes

Apple's pages do not give these values; asnsim's defaults, each one changeable per step:

- Transaction IDs: 16 digits starting with 2; `appTransactionId` 18 digits. Storefront `USA`,
  `storefrontId` `143441`.
- Billing Grace Period: 16 days (`gracePeriod`). Renewal date extension: 7 days (`extendBy`).
- A price increase without `price`: 20%. A promotional or win-back offer without `price`: half the
  product's price.
- External purchase tokens: `tokenType` SERVICES for custom link tokens, expiring a year after
  creation.
- Time between steps when neither `after` nor `at` is given; see
  [Write a scenario](scenarios.md#when-each-step-happens).

Fields Apple added in 2025 and 2026 that asnsim does not write yet (planned): `billingPlanType`,
`commitmentInfo`, `renewalBillingPlanType`, `eligibleWinBackOfferIds`, `advancedCommerceInfo`.
`set` writes any of them by hand.
