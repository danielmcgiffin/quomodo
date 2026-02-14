#!/usr/bin/env bash
set -euo pipefail

# One-time helper for SR-05A: apply repo migrations to a dedicated E2E Supabase project.
#
# Requires:
# - SUPABASE_ACCESS_TOKEN
# - E2E_SUPABASE_PROJECT_REF
# - E2E_SUPABASE_DB_PASSWORD
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=... E2E_SUPABASE_PROJECT_REF=... E2E_SUPABASE_DB_PASSWORD=... \
#     bash scripts/setup-e2e-supabase.sh

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN" >&2
  exit 1
fi
if [[ -z "${E2E_SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Missing E2E_SUPABASE_PROJECT_REF" >&2
  exit 1
fi
if [[ -z "${E2E_SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Missing E2E_SUPABASE_DB_PASSWORD" >&2
  exit 1
fi

echo "Linking Supabase project: ${E2E_SUPABASE_PROJECT_REF}"
npx supabase link --project-ref "${E2E_SUPABASE_PROJECT_REF}" --password "${E2E_SUPABASE_DB_PASSWORD}" --yes

echo "Pushing migrations to linked project"
npx supabase db push --include-all --yes

echo "E2E Supabase project is now migration-aligned."

