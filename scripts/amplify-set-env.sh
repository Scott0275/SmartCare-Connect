#!/usr/bin/env bash
# Usage: APP_ID=your-app-id ENV_FILE=env-vars.json ./scripts/amplify-set-env.sh

set -euo pipefail

if [ -z "${APP_ID:-}" ]; then
  echo "Please set APP_ID environment variable"
  echo "Example: APP_ID=your-app-id ENV_FILE=env-vars.json ./scripts/amplify-set-env.sh"
  exit 1
fi

ENV_FILE=${ENV_FILE:-env-vars.json}

if [ ! -f "$ENV_FILE" ]; then
  echo "Env file $ENV_FILE not found. Create a JSON file like: { \"NEXT_PUBLIC_API_GATEWAY_URL\": \"https://...\", \"NEXT_PUBLIC_USE_AWS\": \"true\" }"
  exit 1
fi

# Convert JSON to a comma separated key=value pairs string
KV_PAIRS=$(jq -r 'to_entries | map("\(.key)=\(.value)") | join(",")' "$ENV_FILE")

if [ -z "$KV_PAIRS" ]; then
  echo "No variables found in $ENV_FILE"
  exit 1
fi

echo "Updating Amplify app ($APP_ID) with environment variables from $ENV_FILE"
aws amplify update-app --app-id "$APP_ID" --environment-variables "$KV_PAIRS"

echo "Done. You can now trigger a release to pick up new build-time variables." 
