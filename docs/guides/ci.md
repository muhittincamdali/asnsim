# Run asnsim in CI

A CI job needs three things: the asnsim command, a backend started with the test root, and the
scenarios to play. A test chain is cheap to make, so the job makes its own with `asnsim init`
instead of keeping one in the repository.

## GitHub Actions

[examples/github-actions/asnsim.yml](../../examples/github-actions/asnsim.yml) is a complete
workflow. Its steps:

```yaml
- name: Install asnsim from its GitHub release
  run: npm install --global https://github.com/muhittincamdali/asnsim/releases/download/v0.1.0/asnsim-0.1.0.tgz

- name: Create the test chain
  run: asnsim init --bundle-id com.example.app

- name: Start the backend with the test root
  env:
    ASN_TEST_ROOT: .asnsim/root.cer
  run: npm --prefix server start > server.log 2>&1 &

- name: Play the scenarios
  run: asnsim run trial-renew-refund --url http://127.0.0.1:3000/notifications --duplicate --format markdown >> "$GITHUB_STEP_SUMMARY"
```

The Markdown report goes to the job summary; the exit code fails the job when a notification is
rejected or a check does not match.

## Exit codes

| Code | Meaning                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------- |
| 0    | Every notification passed: answered 200 to 206 (or the step's `expect`), and its check matched |
| 1    | A delivery, an expectation or a check failed                                                   |
| 2    | Bad arguments, no test chain, a scenario that does not load, or an unexpected error            |

## Reports

- `--format markdown` for job summaries and pull request comments.
- `--json` for scripts: each step has `index`, `name`, `type`, `subtype`, `access`, `at`,
  `signedDate`, `notificationUUID`, the transaction IDs, every `attempts` entry (status, body,
  time, kind), the `check` and the `findings` with their fix. `schemaVersion` is 0 and may change
  before 1.0. [examples/shell/failed-steps.sh](../../examples/shell/failed-steps.sh) lists the
  failed steps with `jq`.
- `--out <folder>` keeps each request body, so a failure can be replayed with `curl` or decoded.

## Without a running backend

`--dry-run --out bodies` signs the notifications and writes them, sending nothing. A unit test can
then feed the files to the handler directly; [examples/swift-verifier](https://github.com/muhittincamdali/asnsim/tree/main/examples/swift-verifier)
verifies them with Apple's Swift library this way.
