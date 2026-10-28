# Examples

| Example                                                | What it shows                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| [node-receiver](node-receiver)                         | A webhook on Apple's Node.js library that trusts the asnsim root only in tests, with two scenarios that check its entitlements |
| [swift-verifier](swift-verifier)                       | Apple's Swift library verifying the bodies asnsim writes                                                                       |
| [github-actions/asnsim.yml](github-actions/asnsim.yml) | A workflow that starts a backend with the test root and plays scenarios on every pull request                                  |
| [shell/failed-steps.sh](shell/failed-steps.sh)         | The failed notifications of a run, from the JSON report, with `jq`                                                             |
| [shell/verify-in-swift.sh](shell/verify-in-swift.sh)   | A scenario written to files and verified with the Swift library                                                                |

The repository's tests run the Node.js receiver against its scenarios and every notification type
([test/integration/examples.test.ts](../test/integration/examples.test.ts)); the Swift verifier
runs in the Examples workflow.
