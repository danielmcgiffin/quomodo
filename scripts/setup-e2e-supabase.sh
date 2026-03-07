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

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

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

link_project_pooler_preferred() {
  # Prefer pooler (IPv4-friendly on GitHub runners). If this fails, fall back
  # to explicit password link for compatibility with older CLI behavior.
  if npx supabase link --project-ref "${E2E_SUPABASE_PROJECT_REF}" --yes; then
    return 0
  fi

  echo "Pooler-first link failed; retrying with explicit DB password..." >&2
  npx supabase link \
    --project-ref "${E2E_SUPABASE_PROJECT_REF}" \
    --password "${E2E_SUPABASE_DB_PASSWORD}" \
    --yes
}

push_migrations_once() {
  npx supabase db push \
    --include-all \
    --yes \
    --password "${E2E_SUPABASE_DB_PASSWORD}" 2>&1
}

echo "Linking Supabase project (pooler/IPv4 preferred): ${E2E_SUPABASE_PROJECT_REF}"
link_project_pooler_preferred

max_attempts=5
for attempt in $(seq 1 "${max_attempts}"); do
  echo "Pushing migrations to linked project (attempt ${attempt}/${max_attempts})"

  set +e
  push_output="$(push_migrations_once)"
  push_exit=$?
  set -e

  echo "${push_output}"

  if [[ ${push_exit} -eq 0 ]]; then
    echo "E2E Supabase project is now migration-aligned."
    exit 0
  fi

  if grep -qi "IPv6 is not supported" <<<"${push_output}"; then
    echo "Detected IPv6-only DB route. Re-linking via pooler (IPv4) and retrying..." >&2
    link_project_pooler_preferred
    continue
  fi

  if grep -qi "status is COMING_UP" <<<"${push_output}"; then
    sleep_seconds=$((attempt * 15))
    echo "Project still COMING_UP. Waiting ${sleep_seconds}s before retry..." >&2
    sleep "${sleep_seconds}"
    link_project_pooler_preferred
    continue
  fi

  echo "Migration push failed with a non-retryable error." >&2
  exit "${push_exit}"
done

echo "Migration push failed after ${max_attempts} attempts." >&2
exit 1
