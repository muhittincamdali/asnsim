#!/bin/sh
# Writes the bodies of a scenario without sending them and verifies each with Apple's Swift
# library (examples/swift-verifier). Run from the repository root after `asnsim init`.
set -eu
scenario="${1:-billing-retry-grace-recovery}"
out=".asnsim-bodies/$scenario"
asnsim run "$scenario" --dry-run --out "$out"
cd examples/swift-verifier
swift run -q VerifyNotification ../../.asnsim/root.cer ../../"$out"/*.json
