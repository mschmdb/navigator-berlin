#!/usr/bin/env bash
# Deploy main to production via the Coolify API and wait for the result.
# Token: macOS keychain, service coolify-navigator-prod, account navigator.
set -euo pipefail

COOLIFY_URL="https://coolify.navigator.berlin/api/v1"
APP_UUID="v114bqfpzsdmkmd0c65473s7"
POLL_SECONDS=20
MAX_POLLS=45

token="$(security find-generic-password -s coolify-navigator-prod -a navigator -w)"

coolify() {
	curl -sS --fail-with-body -H "Authorization: Bearer ${token}" "$@"
}

# Coolify 4.3+ only accepts POST here; GET answers with an error message.
response="$(coolify -X POST "${COOLIFY_URL}/deploy?uuid=${APP_UUID}")"
deployment="$(printf '%s' "${response}" | python3 -c '
import json, sys
data = json.load(sys.stdin)
try:
    print(data["deployments"][0]["deployment_uuid"])
except (KeyError, IndexError, TypeError):
    sys.exit("Deploy not queued: " + json.dumps(data))
')"
echo "Deployment queued: ${deployment}"

for ((i = 1; i <= MAX_POLLS; i++)); do
	status="$(coolify "${COOLIFY_URL}/deployments/${deployment}" | python3 -c '
import json, sys
data = json.load(sys.stdin)
if isinstance(data, list):
    data = data[0] if data else {}
print(data.get("status", "unknown"))
')"
	case "${status}" in
	finished)
		echo "Deployment ${deployment}: finished"
		exit 0
		;;
	failed | cancelled*)
		echo "Deployment ${deployment}: ${status}" >&2
		exit 1
		;;
	esac
	sleep "${POLL_SECONDS}"
done

echo "Deployment ${deployment}: still ${status} after $((MAX_POLLS * POLL_SECONDS)) s" >&2
exit 1
