# Changelog

All notable changes to asnsim are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and asnsim uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Until 1.0, the scenario format and the
JSON report layout (`schemaVersion` 0) may change in a minor version.

## [Unreleased]

### Security

- `decode` no longer skips verification because a payload says `"environment": "Xcode"`: a
  changed or unsigned token that claimed it decoded with exit 0. Verification is skipped only with
  `--environment Xcode`, as Apple's `SignedDataVerifier` skips it only when set up for Xcode, and
  the skipped part is then reported as a `not-verified` problem (exit 1).
- Reports write a URL that holds a tab or line break, or controls or spaces at either end, as
  scheme, host and port only: the URL parser drops those characters, so a path such as
  `/pin/.<TAB>./4831` was printed as `/4831`.
- Webhook answers no longer show a value next to a name that ends in punctuation
  (`"DbPassword:"`, `["password:", …]`, `"api_key ="`), next to a name with a control character in
  it, or next to a string of control characters alone (`"\t"`).
- A card number wrapped onto the next line or written with `.`, `,` or `/` between its groups is
  hidden in free text.
- Webhook answers no longer show the value of a name and value pair when the value names a secret
  as well (`{"label":"Password","value":"Secret2024!"}`, `{"name":"api_key","value":"livekey"}`,
  `{"ParameterKey":"DbPassword","ParameterValue":"supersecret"}`).
- Names are read without zero-width spaces, soft hyphens, word joiners and byte order marks, and a
  string of those characters alone hides the values next to it, as a string of controls does.
- A `--url` that does not parse is no longer repeated in the usage error, which printed any user
  name and password in it; the message says `<unparsed URL>`.

### Fixed

- A JSON answer with several hidden member names keeps all of them (`[redacted]`,
  `[redacted 2]`, …) instead of one.
- Reports write U+2028 and U+2029 as code points, like the other control characters.
- Markdown reports escape `! ( ) & ~` and bare URLs in decoded text, so it no longer renders as an
  image, a link, an entity or strikethrough.

## [0.1.0] - 2026-10-28

### Added

- `asnsim init`: a three-certificate test chain shaped like the App Store's (the WWDR and receipt
  signing extensions Apple's verifiers check), its signing key and the app settings in `.asnsim/`.
- Signed App Store Server Notifications V2 for all 23 `notificationType` values and 40 type and
  subtype pairs Apple documents (read on 28 October 2026), in Sandbox and Production, with the
  transaction, renewal info and app transaction signed inside.
- A simulation of one customer that keeps transaction IDs, dates and renewal info consistent: trials
  and offers, renewals, billing retry and Billing Grace Period, expiry for each reason, upgrades and
  downgrades, price increases, refunds and their reversal, Family Sharing and organization
  revocations, consumption requests, renewal extensions, external purchase tokens.
- `asnsim run` with scenario files (YAML or JSON) and nine built-in scenarios; `asnsim send` for one
  notification after its history, or all 40 with `--all`; `asnsim payload` to print a body.
- Delivery by the App Store's rules (200 to 206 is success, redirects are not followed),
  `--retries`, `--duplicate`, per-step `expect` and `check`, live and fixed clocks, `--dry-run` and
  `--out`.
- `asnsim decode`: decodes a notification body, signed payloads and App Store Server API responses,
  and checks every JWS like Apple's `SignedDataVerifier` with online checks off, against Apple Root
  CA - G3, the test root or `--root`; reads StoreKit Testing data from Xcode.
- Terminal, text, Markdown and JSON reports; exit codes 0, 1 and 2. Reports never show URL user
  names, passwords, fragments or query values, write IDs in paths as `:id`, and show webhook and
  check answers redacted (JSON values under secret names, card numbers, e-mail addresses, tokens;
  text cut at its first possible secret).
- Check URLs are paths on the webhook's origin that start with a single `/`, tested before sending
  and again once their placeholders are filled in; `--header` values go nowhere else. A `--url`
  with a user name or password is a usage error.
- `decode` reports a nested JWS it does not decode (outside `data.signed…` and `appData.signed…`)
  as an `unread-jws` problem, and a payload nested more than 64 levels deep as `deep-payload`
  without printing it.
- A JavaScript API (`@mcamdali/asnsim`), a TypeDoc site with six guides, examples for Node.js,
  Swift, GitHub Actions and the shell, and terminal demos recorded from the CLI.

[Unreleased]: https://github.com/muhittincamdali/asnsim/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0
