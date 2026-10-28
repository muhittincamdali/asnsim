#!/bin/sh
# Lists the notifications a run did not deliver as the App Store expects, one per line, from the
# JSON report:
#
#   asnsim run trial-renew-refund --url http://localhost:3000/notifications --json | sh failed-steps.sh
#
# Needs jq (https://jqlang.org).
jq -r '.steps[] | select(.ok | not) | "\(.index). \(.name): \(.findings | map(.code) | join(", "))"'
