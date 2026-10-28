# Contributing to asnsim

Thanks for taking the time to improve asnsim. The
[shared contributing guide](https://github.com/muhittincamdali/.github/blob/main/CONTRIBUTING.md)
applies (small fixes as a pull request, larger changes as an issue first, security issues through
[SECURITY.md](SECURITY.md), the
[code of conduct](https://github.com/muhittincamdali/.github/blob/main/CODE_OF_CONDUCT.md) for
everyone). This file adds what is specific to this repository.

## Set up

Node.js 22.12 or later, then:

```sh
git clone https://github.com/muhittincamdali/asnsim.git
cd asnsim
npm ci
npm test          # builds dist/ first, then runs every test
```

CI runs `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` on Node.js 22 and 24;
if they pass locally they pass on your pull request. Tests write only to `.test-work/` and talk
only to servers they start on 127.0.0.1; they need neither the network nor an Apple account.

| Command             | What it does                                                                            |
| ------------------- | --------------------------------------------------------------------------------------- |
| `npm run lint`      | Biome (code) and Prettier (formatting); `npm run format` fixes formatting               |
| `npm run typecheck` | TypeScript in strict mode over `src/`, `test/`, `scripts/` and `examples/`              |
| `npm test`          | Unit, integration, snapshot and end-to-end tests, Apple's Node.js library included      |
| `npm run demo`      | Records the terminal SVGs in `docs/media/` (needs port 3000 free)                       |
| `npm run docs`      | Builds the documentation site into `site/` (run `npm ci --prefix docs/site` once first) |
| `npm run smoke`     | Packs the package, installs the tarball and runs it                                     |

The Swift example needs Swift 6.4 (its Package.resolved pins packages that need it): see
[examples/swift-verifier](examples/swift-verifier).

## Where things live

- `catalog/notifications.json`: every type and subtype, with its payload object, products, access
  and Apple's pages. `src/catalog.ts` loads and checks it.
- `src/pki/`: the DER writer and reader, the test chain, Apple Root CA - G3 and the verifier checks.
  `src/jws/`: ES256 compact JWS.
- `src/sim/`: the customer simulation (`simulation.ts`), its state, products, durations, seeded IDs,
  the payload writer (`payloads.ts`) and the history of a standalone send (`standalone.ts`).
- `src/scenario/`: the scenario schema and loader; `scenarios/`: the built-in scenarios.
- `src/run/`: delivery, the App Store's rules, checks and the findings with their fixes.
- `src/decode/`: the decoder. `src/report/`: the reports. `src/cli/`: arguments and exit codes.

## Tests

- A bug fix starts with a test that fails without it.
- The decoded payload of every pair is a snapshot in `test/__snapshots__/payloads`, and the
  reports in `test/__snapshots__/reports`. When output changes on purpose, run `npm test -- -u`,
  read the diff, and run `npm run demo` if the terminal output changed.
- `test/integration/apple-library-events.test.ts` hands every notification to Apple's Node.js
  library. A change to the payloads must keep it passing in both environments.

## Adding to the catalog

A new notification type or subtype goes into `catalog/notifications.json` with the page of Apple's
documentation that lists it, into the value lists of `test/unit/catalog.test.ts`, and into the
simulation if it changes state. Summaries are in our own words; what a notification means for
access comes from Apple's description of it. A value Apple's pages do not give is asnsim's choice
and goes into the "Choices asnsim makes" list of
[docs/guides/notifications.md](docs/guides/notifications.md).

## Wording

asnsim says what it simulates. Do not call a payload "identical to Apple's": it follows Apple's
field definitions. Keep planned features marked as planned, and give every number in the docs
with the machine and date it was measured on. The hygiene check in CI rejects unverifiable
superlatives.

## Commits and pull requests

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`,
`test:`, `refactor:`, `build:`, `ci:`, `chore:`), one topic per pull request, and an entry under
"Unreleased" in [CHANGELOG.md](CHANGELOG.md) for anything a user would notice.
