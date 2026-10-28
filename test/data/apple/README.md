# Apple's public certificates

The chain the App Store signs notifications with, used to test that `asnsim decode` checks a real
Apple chain the way Apple's libraries do. All three are public certificates; none holds a key.

| File                                | Certificate                                                                             | SHA-256 (DER)       | From                                                                                                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppleRootCA-G3.cer`                | Apple Root CA - G3, valid 2014-04-30 to 2039-04-30                                      | `63343abf…653e9179` | [apple.com/certificateauthority](https://www.apple.com/certificateauthority/AppleRootCA-G3.cer), downloaded 28 October 2026                                                                         |
| `AppleWWDRCAG6.cer`                 | Apple Worldwide Developer Relations Certification Authority G6, valid 2021 to 2036      | `bdd4ed6e…f642ca30` | [apple.com/certificateauthority](https://www.apple.com/certificateauthority/AppleWWDRCAG6.cer), downloaded 28 October 2026                                                                          |
| `prod-ecc-receipt-signing-2025.cer` | Prod ECC Mac App Store and iTunes Store Receipt Signing, valid 2025-09-19 to 2027-10-13 | `4c381556…1e84c417` | The `x5c` signing certificate in the tests of [apple/app-store-server-library-node](https://github.com/apple/app-store-server-library-node) 3.1.0 (`REAL_APPLE_SIGNING_CERTIFICATE_BASE64_ENCODED`) |

The tests check that the signing certificate chains to the root through G6 and carries the
extensions asnsim's test chain copies.
