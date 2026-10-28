# Data signed by Xcode StoreKit Testing

Two JWS that StoreKit returned in an iOS app under StoreKit Testing in Xcode, recorded on
28 October 2026 with Xcode 27.1 on an iPhone 17 simulator with iOS 27.0:

| File                           | What                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| `transaction-subscription.jws` | `Transaction.latest(for: "com.example.premium.monthly")?.jwsRepresentation` after a purchase |
| `renewal-info.jws`             | `Product.SubscriptionInfo.status(for: "21000001")` → `renewalInfo.jwsRepresentation`         |

Both say `"environment": "Xcode"`, carry the header `kid` `Apple_Xcode_Key` and one certificate in
`x5c`: Xcode signs them, not the App Store. They are the real input of `asnsim decode` tests for
data that cannot be checked against Apple's root.

`probe/` is the project that recorded them: a host app (`com.example.app`) and a unit test that
buys from `Products.storekit` with `SKTestSession` and writes the JWS to the file named in
`XCODE_JWS_OUT`. To record again:

```sh
cd test/data/xcode/probe
xcodegen generate
TEST_RUNNER_XCODE_JWS_OUT=$PWD/out.txt xcodebuild test -project StoreKitProbe.xcodeproj \
  -scheme StoreKitProbe -destination 'platform=iOS Simulator,name=iPhone 17'
```
