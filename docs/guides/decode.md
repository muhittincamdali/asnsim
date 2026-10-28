# Decode what the App Store sent

`asnsim decode` reads a notification or signed transaction, decodes every JWS in it and checks each
one the way Apple's App Store Server Libraries do. It reads only what you give it and sends
nothing anywhere.

```sh
asnsim decode notification.json          # a file
pbpaste | asnsim decode -                # standard input
asnsim decode eyJhbGciOiJFUzI1NiIs…      # the token itself
```

## What it accepts

- A notification body as your server received it: `{"signedPayload": "…"}`.
- A bare `signedPayload`, `signedTransactionInfo`, `signedRenewalInfo` or
  `signedAppTransactionInfo`, quoted or not.
- An App Store Server API response that holds one of them (`signedTransactionInfo` of Get
  Transaction Info, for example).
- A transaction from StoreKit in your app (`jwsRepresentation`), including one from StoreKit
  Testing in Xcode.

Inside a notification it follows `data.signedTransactionInfo`, `data.signedRenewalInfo` and
`appData.signedAppTransactionInfo`, and decodes each as a part of its own.

## What it checks

For each JWS, in the order of Apple's `SignedDataVerifier` with online checks off:

1. `alg` is ES256 and `x5c` holds three certificates. The third is not used; the trusted roots
   are.
2. The intermediate is issued by a trusted root, the signing certificate by the intermediate, and
   the intermediate is a CA.
3. The signing certificate carries Apple's receipt signing extension
   (`1.2.840.113635.100.6.11.1`), the intermediate the WWDR extension
   (`1.2.840.113635.100.6.2.1`).
4. All three certificates are valid at the payload's `signedDate`.
5. The signature verifies.

`--bundle-id` and `--environment` add the app checks of Apple's verifier.

Trusted roots: Apple Root CA - G3, built into asnsim from
[apple.com/certificateauthority](https://www.apple.com/certificateauthority/); the asnsim test root
when `.asnsim/root.cer` exists in the folder (or in `--dir`); and every `--root` file, DER or PEM.
`--no-apple-root` leaves Apple's root out, and `--no-verify` decodes without checking.

Revocation is not checked: that takes a request to Apple's OCSP server, and asnsim reads nothing
online. A backend in production should keep online checks on.

## Data from StoreKit Testing in Xcode

A transaction your app gets under StoreKit Testing says `"environment": "Xcode"`, has the header
`kid` `Apple_Xcode_Key` and one certificate in `x5c`: Xcode signs it, not the App Store. Apple's
server libraries skip verification for the Xcode environment, and so does `asnsim decode`: it
prints the fields, marks the part "not checked: signed by Xcode" and exits 0.
[test/data/xcode](https://github.com/muhittincamdali/asnsim/tree/main/test/data/xcode) holds one recorded with Xcode 27.1, and the probe that
recorded it.

## Exit codes and JSON

`0` decoded and verified (or not asked to verify), `1` a problem, `2` input that is not a JWS or
JSON holding one. `--json` prints every part with its payload, header, verification, certificates
(subject, issuer, validity, SHA-256) and the problems, `schemaVersion` 0.
