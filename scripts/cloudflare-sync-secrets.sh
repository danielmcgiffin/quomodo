#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f ".env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.local"
  set +a
fi

required_vars=(
  CLOUDFLARE_API_TOKEN
  PUBLIC_SUPABASE_URL
  PUBLIC_SUPABASE_ANON_KEY
  PRIVATE_SUPABASE_SERVICE_ROLE
  PRIVATE_STRIPE_API_KEY
)

secret_vars=(
  PUBLIC_SUPABASE_URL
  PUBLIC_SUPABASE_ANON_KEY
  PRIVATE_SUPABASE_SERVICE_ROLE
  PRIVATE_STRIPE_API_KEY
)

missing_vars=()
for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name:-}" ]; then
    missing_vars+=("$var_name")
  fi
done

if [ "${#missing_vars[@]}" -gt 0 ]; then
  echo "Missing required environment variables:"
  for var_name in "${missing_vars[@]}"; do
    echo "  - ${var_name}"
  done
  echo "Set them in your shell or .env.local, then rerun."
  exit 1
fi

put_secret() {
  local key="$1"
  local target="$2"

  if [ "$target" = "production" ]; then
    printf '%s' "${!key}" | npx wrangler secret put "$key" --env "" >/dev/null
  else
    printf '%s' "${!key}" | npx wrangler secret put "$key" --env "$target" >/dev/null
  fi

  echo "Set ${key} (${target})."
}

for var_name in "${secret_vars[@]}"; do
  put_secret "$var_name" production
done

for var_name in "${secret_vars[@]}"; do
  put_secret "$var_name" preview
done

echo "Cloudflare secret sync complete for production and preview."
