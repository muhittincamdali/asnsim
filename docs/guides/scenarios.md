# Write a scenario

A scenario is one customer's purchase history as a list of notifications. asnsim keeps the
history consistent: one original transaction ID, a new transaction ID on every renewal, renewal
dates one period apart, the renewal info following each change. It signs and sends one
notification per step. Scenarios are YAML or JSON.

```yaml
description: Basic to Premium at once, then back to Basic at the next renewal.
products:
  - { id: com.example.basic.monthly, type: auto-renewable, period: P1M, price: 4.99, level: 2 }
  - { id: com.example.premium.monthly, type: auto-renewable, period: P1M, price: 9.99, level: 1 }
steps:
  - type: SUBSCRIBED
    subtype: INITIAL_BUY
    product: com.example.basic.monthly
  - type: DID_CHANGE_RENEWAL_PREF
    subtype: UPGRADE
    product: com.example.premium.monthly
    after: P5D
    check:
      {
        url: '/entitlements/{originalTransactionId}',
        json: { productId: com.example.premium.monthly },
      }
  - type: DID_CHANGE_RENEWAL_PREF
    subtype: DOWNGRADE
    product: com.example.basic.monthly
  - type: DID_RENEW
```

```sh
asnsim run upgrade.yaml --url http://localhost:3000/notifications
asnsim scenarios                   # the nine built-in scenarios and their steps
asnsim types                       # every type and subtype
```

## Top level

| Key               | Default              | Meaning                                                                               |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `steps`           | required             | 1 to 500 steps, in order                                                              |
| `products`        | the default products | The In-App Purchases of the scenario (below)                                          |
| `description`     |                      | Shown at the top of the report                                                        |
| `name`            | the file name        | Shown in the report                                                                   |
| `start`           | now                  | ISO 8601 time of the first step. With it, dates are the scenario's own (fixed clock). |
| `seed`            | random               | The same seed gives the same transaction IDs and notificationUUIDs                    |
| `appAccountToken` |                      | A UUID written into every transaction and renewal info, as an app sets it at purchase |

## Products

| Key        | Meaning                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------- |
| `id`       | Product ID                                                                                  |
| `type`     | `auto-renewable`, `consumable`, `non-consumable` or `non-renewing`                          |
| `period`   | ISO 8601 subscription period such as `P1W`, `P1M`, `P1Y`; auto-renewable subscriptions only |
| `price`    | In the currency's units (`9.99`); transactions carry it in milliunits (`9990`)              |
| `currency` | ISO 4217 code, default `USD`                                                                |
| `group`    | `subscriptionGroupIdentifier`, default `21000001`                                           |
| `level`    | Level in the group; 1 is the highest. Moving to a lower number is an upgrade.               |

Without `products`, asnsim uses `com.example.premium.monthly` (level 1, 9.99) and
`com.example.basic.monthly` (level 2, 4.99) in one monthly group, plus `com.example.coins.100`
(consumable), `com.example.lifetime` (non-consumable) and `com.example.season.pass`
(non-renewing).

## Steps

| Key           | Meaning                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | `notificationType`, such as `DID_RENEW`                                                                                                                 |
| `subtype`     | Required when the type has no event without one (`SUBSCRIBED`, `PRICE_INCREASE`). Leave it out for the event without a subtype.                         |
| `product`     | What to buy, the target of an upgrade or downgrade, or the purchase a refund is for                                                                     |
| `after`       | Time since the previous step (ISO 8601 duration), instead of the event's own moment                                                                     |
| `at`          | Absolute time of the step                                                                                                                               |
| `offer`       | `{ type: introductory \| promotional \| offer-code \| win-back, id, discount: FREE_TRIAL \| PAY_AS_YOU_GO \| PAY_UP_FRONT \| ONE_TIME, period, price }` |
| `refund`      | `{ reason: 0 \| 1, percentage }`: `revocationReason`, and a share below 100 for a prorated refund                                                       |
| `reason`      | `consumptionRequestReason` of a `CONSUMPTION_REQUEST`                                                                                                   |
| `price`       | New price of a `PRICE_INCREASE` or `PRICE_CHANGE`                                                                                                       |
| `extendBy`    | How far `RENEWAL_EXTENDED` moves the renewal date, default `P7D`                                                                                        |
| `gracePeriod` | Length of Billing Grace Period for `DID_FAIL_TO_RENEW/GRACE_PERIOD`, default `P16D`                                                                     |
| `ownership`   | `PURCHASED`, `FAMILY_SHARED` or `ASSIGNED`                                                                                                              |
| `quantity`    | Quantity, or seats of an assigned subscription                                                                                                          |
| `set`         | `{ notification, data, transaction, renewalInfo }`: fields merged in last; `null` removes a field                                                       |
| `expect`      | `{ status: 200 }` or `{ status: [200, 202] }`: what the webhook must answer. Default: 200 to 206, as the App Store.                                     |
| `check`       | A request after the notification (below)                                                                                                                |
| `duplicate`   | `true` sends the notification twice                                                                                                                     |
| `name`        | Shown in the report instead of the type                                                                                                                 |

`set` sends what asnsim would not write, for example a field your backend must survive without:

```yaml
- type: DID_RENEW
  set: { transaction: { appAccountToken: null }, data: { bundleVersion: '2.0' } }
```

## When each step happens

The first step happens at `start`. A later step happens where the event would happen, unless
`after` or `at` says otherwise:

| Step                             | Default time                        |
| -------------------------------- | ----------------------------------- |
| `DID_RENEW`, `DID_FAIL_TO_RENEW` | the end of the current period       |
| `DID_RENEW/BILLING_RECOVERY`     | one day after the previous step     |
| `GRACE_PERIOD_EXPIRED`           | the end of Billing Grace Period     |
| `EXPIRED/BILLING_RETRY`          | 60 days after billing retry started |
| other `EXPIRED`                  | the end of the current period       |
| `SUBSCRIBED/RESUBSCRIBE`         | seven days after the previous step  |
| everything else                  | one day after the previous step     |

A step that would happen before the previous one is an error.

### Dated when sent, or dated by the scenario

Without `start` (and without `--start`), each notification is dated when asnsim sends it. The
renewal you send now has `purchaseDate` now and `expiresDate` one month from now, the same
offsets the scenario's timeline has. A backend that compares `expiresDate` with the current
time then sees what it would see in production. This is the `live` clock.

With `start`, dates are exactly the scenario's (`fixed` clock): reproducible, and the test chain
covers two years back and ten forward. `--clock` picks one explicitly.

## Checks

A check is a request asnsim makes after a delivered notification, to see what the backend did.

```yaml
check:
  url: '/entitlements/{originalTransactionId}' # relative to the webhook URL
  method: GET # or POST
  status: 200 # default 200
  json: { active: false } # these keys with these values
  contains: 'revoked' # or text in the body
```

The URL is a path that starts with a single `/`, relative to the webhook URL, and must stay on
its origin (scheme, host and port); a check on another host, port or scheme is refused before
anything is sent. The URL is tested again once its placeholders are filled in, and a value that
moves it elsewhere (an empty one turns `/{originalTransactionId}/x` into `//x`, another host)
stops the run with a usage error before the check is sent. So a scenario cannot send requests, or
your `--header` values, elsewhere.

Placeholders: `{originalTransactionId}`, `{transactionId}`, `{productId}`,
`{notificationUUID}`, `{appAccountToken}`, `{bundleId}`. `json` matches a subset: every key
given must be there with that value; arrays must match element by element. Quote the URL in YAML
when it starts with `{` or holds `{…}` inside a flow map.

## Errors

A scenario is checked before anything is sent; the message names the field:

```text
asnsim: steps[2].after: an ISO 8601 duration such as P1M or P3D
asnsim: steps[0]: EXPIRED has no subtype LATE. Subtypes of EXPIRED: VOLUNTARY, BILLING_RETRY, PRICE_INCREASE, PRODUCT_NOT_FOR_SALE, (none).
asnsim: steps[1].check.url: unknown placeholder {userId}. Placeholders: {originalTransactionId}, …
```

Exit code 2 means the scenario did not load; 1 that a notification or a check failed.
