# Security policy

## Supported versions

Security fixes are made for the latest release of each project. If you are on an older version,
the fix will be in a new release and the upgrade notes will say if anything changes for you.

## Reporting a vulnerability

Please report vulnerabilities privately, not in a public issue, pull request or discussion.

1. **Preferred:** open the repository's **Security** tab and choose
   **Report a vulnerability** ([how private reporting works](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately)).
2. **Or** email [muhittincamdali@gmail.com](mailto:muhittincamdali@gmail.com) with
   "Security" in the subject.

Include what you can of the following:

- the affected repository and version (tag or commit),
- what an attacker can do and under which conditions,
- steps or a small file that reproduces it,
- any fix or mitigation you already have in mind.

## What happens next

- You get a reply within 7 days confirming that the report arrived.
- I confirm the issue, work on a fix and agree a disclosure date with you. Fixes are released as
  soon as they are ready, together with a GitHub security advisory.
- You are credited in the advisory unless you prefer not to be.

Please give a reasonable amount of time to fix the issue before disclosing it publicly.

## Scope for asnsim

**The test root is for tests.** asnsim's certificates verify only where a backend trusts
`.asnsim/root.cer`. A server that trusts it in production would accept notifications anyone with
the folder can sign. Load it only in test configurations and refuse it in production, as
[examples/node-receiver](examples/node-receiver/receiver.mjs) does. asnsim never signs anything
that verifies against Apple's roots, and every certificate it makes says `asnsim (not Apple)`.

**What asnsim keeps.** `asnsim init` writes `.asnsim/` with the signing key in `signing-key.pem`
(mode 0600 on macOS and Linux) and a `.gitignore` of `*`. The private keys of the test root and the
intermediate are discarded once the chain exists, so the root cannot vouch for any other key.

**What asnsim sends.** Requests go only to the `--url` you give and to the check URLs of the
scenario you run, and a check URL must be a path that starts with a single `/` on the webhook's
origin (scheme, host and port): a scenario that names another host, port or scheme is refused
before anything is sent, and the URL is tested again once its placeholders are filled in, so a
value cannot move it to another host either (an empty one would turn `/{originalTransactionId}/x`
into `//x`). So a scenario file from someone else cannot make asnsim request other hosts or carry
your `--header` values elsewhere. A `--url` with a user name or password is refused (exit 2); send
credentials with `-H` instead. Redirects are not followed. `asnsim decode` makes no requests at
all; it does not check revocation.

**What the reports show.** Run and send reports (every format, and the files `-o` writes) are
meant to be pasted into CI logs and pull requests, so they never show the user name, password or
fragment of a URL, the values of its query parameters, or path segments that hold an ID (written
`:id`). `--header` values are never printed. A webhook's or a check's answer is read by its content type
and shown redacted only when that type is JSON or `text/plain`; any other body, and one without a
content type, is left out (`[body omitted: N bytes, <type>]`). In what is shown, JSON values under keys that name a secret (`password`, `token`, `authorization`…) or next to a
field that names one, card numbers, e-mail addresses, JWTs and long tokens are replaced by
`[redacted]`, and in text everything from the first word that may hold or name a secret to the end
is one `[redacted]`. The rules are the ones the author's Swift packages share, read more strictly
where that was simpler; [docs/guides/ci.md](docs/guides/ci.md#what-the-reports-hide) has examples.
Requests themselves are sent as written. Hiding is a safety net, not a guarantee: keep real
credentials out of test webhooks.

**What asnsim reads.** Scenario files up to 1 MB and 500 steps, decode input up to 2 MB, a JWS up to
1,000,000 characters, DER nested at most 32 levels, YAML with at most 100 aliases, and the first
64 KB of each answer. Decode input and `--root` files are read as a stream and refused at the
first byte past 2 MB: `asnsim decode /dev/zero` stops with exit 2 in 0.10 to 0.13 seconds at
72 MB maximum resident set size (measured on a Mac (Apple silicon) with Node.js 26). Webhook answers and decoded fields are printed with control and
bidirectional characters shown as `<U+XXXX>`, so they cannot rewrite the screen, recolour the
terminal or reorder text; JSON reports keep them as they were.

Reports that fit this policy include, for example: input that makes asnsim hang, exhaust memory,
write outside `.asnsim/`, `--out` or `--output`, send a request to a host the user did not name,
leak `--header` values, or print terminal escape sequences; and a payload that `decode` reports as
verified although its chain or signature should fail Apple's checks.
