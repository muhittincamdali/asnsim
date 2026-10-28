# Changelog

All notable changes to asnsim are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and asnsim uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). Until 1.0, the scenario format and the
JSON report layout (`schemaVersion` 0) may change in a minor version.

## [Unreleased]

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
- Terminal, text, Markdown and JSON reports; exit codes 0, 1 and 2.
- A JavaScript API (`@mcamdali/asnsim`), a TypeDoc site with six guides, examples for Node.js,
  Swift, GitHub Actions and the shell, and terminal demos recorded from the CLI.

[Unreleased]: https://github.com/muhittincamdali/asnsim/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/muhittincamdali/asnsim/releases/tag/v0.1.0
