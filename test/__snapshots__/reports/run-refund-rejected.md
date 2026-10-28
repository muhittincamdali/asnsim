# asnsim: trial-renew-refund

A one-week free trial, its first paid renewal, then a refund of that renewal.

- Webhook: `http://127.0.0.1:PORT/asn`
- App: `com.example.pantry`, Sandbox
- Dates: the scenario’s own
- asnsim 0.1.1

| # | Notification | Answer | Time | Check | Result |
| - | ------------ | ------ | ---- | ----- | ------ |
| 1 | SUBSCRIBED/INITIAL\_BUY | 200 | N ms |  | ok |
| 2 | DID\_RENEW | 200 | N ms |  | ok |
| 3 | REFUND | 500 | N ms |  | **rejected** |

**2 of 3 notifications passed · 1 failed · 3 requests**

## Failures

### 3. REFUND: rejected

The webhook answered 500: the App Store would count the delivery as failed.

- The App Store counts HTTP 200 to 206 as success and every other status as a failed delivery. In production the App Store retries a failed notification five times, 1, 12, 24, 48 and 72 hours after the previous attempt; in the sandbox it sends it once.
- If the endpoint rejects payloads it cannot verify, configure its tests to trust .asnsim/root.cer with online checks off, and the bundle ID and environment in .asnsim/asnsim.json.
- Return 200 for notification types the server does not handle, so the App Store does not retry them.

[Troubleshooting guide](https://github.com/muhittincamdali/asnsim/blob/main/docs/guides/troubleshooting.md#rejected)
