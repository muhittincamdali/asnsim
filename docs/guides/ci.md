# Run asnsim in CI

A CI job needs three things: the asnsim command, a backend started with the test root, and the
scenarios to play. A test chain is cheap to make, so the job makes its own with `asnsim init`
instead of keeping one in the repository.

## GitHub Actions

[examples/github-actions/asnsim.yml](../../examples/github-actions/asnsim.yml) is a complete
workflow. Its steps:

```yaml
- name: Install asnsim from its GitHub release
  run: npm install --global https://github.com/muhittincamdali/asnsim/releases/download/v0.1.1/asnsim-0.1.1.tgz

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

### What the reports hide

A report is written to be pasted into a log or a pull request, so URLs and answers are redacted
in every format, JSON included, and in the files `-o` writes. The requests asnsim sends are not
changed.

| asnsim sent or received                               | The report shows                                             |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `--url 'https://hooks.example.com/asn?token=abc#x'`   | `https://hooks.example.com/asn?token=[redacted]`             |
| check `/entitlements/{originalTransactionId}`         | `http://127.0.0.1:3000/entitlements/:id`                     |
| a path that names a secret: `/v1/cards/4242/pin/4831` | `/v1/cards/:id/pin/:id`                                      |
| answer `denied password=hunter2`                      | `answer: denied password=[redacted]`                         |
| answer `{"user":"bob","password":"hunter2"}`          | `{"user":"bob","password":"[redacted]"}`                     |
| answer `{"label":"Password","value":"hunter2","x":1}` | `{"label":"Password","value":"[redacted]","x":"[redacted]"}` |
| answer `Error: card 4111 1111 1111 1111 declined`     | `Error: [redacted]`                                          |

Text is cut at the first word that may hold or name a secret: anything outside printable ASCII,
quotes, markup, escapes, `@`, a key other than `status`, `method`, `path`, `duration_ms` and
`count`, a secret's name, or a value that looks like a card number, JWT or long token. A name
glued to its value is cut right after the name: `password/x` and `token-x` show as
`password[redacted]` and `token[redacted]`, `path=/v1/pin/x` as `path=/v1/pin[redacted]`. That
hides more than strictly needed (a Turkish error message is cut at its first `ş`); it is meant to.
A JSON answer that names a member twice, or holds half of a UTF-16 pair, is left out of the report
(`[body omitted: …]`), since parsing it would drop or change a member.
A URL with a user name or password is refused before anything is sent.

The rules are tested against the review corpus the author's packages share (7,866 probes): every
probe whose secret the rules say is hidden hides it, except two that free text cannot tell apart,
a value written before its name (`ssh-keygen -N x passphrase`) and the value of `status=`, and two
JSON answers that the reference package hides only for their content type (asnsim reads an answer
as JSON whatever its content type).

## Without a running backend

`--dry-run --out bodies` signs the notifications and writes them, sending nothing. A unit test can
then feed the files to the handler directly; [examples/swift-verifier](https://github.com/muhittincamdali/asnsim/tree/main/examples/swift-verifier)
verifies them with Apple's Swift library this way.
