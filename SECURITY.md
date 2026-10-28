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
scenario you run, and a check URL must have the webhook's origin (scheme, host and port): a
scenario that names another host, port or scheme is refused before anything is sent. So a
scenario file from someone else cannot make asnsim request other hosts or carry your `--header`
values elsewhere. Redirects are not followed. `asnsim decode` makes no requests at all; it does not
check revocation.

**What asnsim reads.** Scenario files up to 1 MB and 500 steps, decode input up to 2 MB, a JWS up to
1,000,000 characters, DER nested at most 32 levels, YAML with at most 100 aliases, and the first
64 KB of each answer. Webhook answers and decoded fields are printed with control and
bidirectional characters shown as `<U+XXXX>`, so they cannot rewrite the screen, recolour the
terminal or reorder text; JSON reports keep them as they were.

Reports that fit this policy include, for example: input that makes asnsim hang, exhaust memory,
write outside `.asnsim/`, `--out` or `--output`, send a request to a host the user did not name,
leak `--header` values, or print terminal escape sequences; and a payload that `decode` reports as
verified although its chain or signature should fail Apple's checks.
