# Cloudflare Deployment Runbook (V1)

This is the canonical deploy flow for SystemsCraft V1.
Cloudflare Workers is the only supported hosting target in launch docs.

## Scope

- Worker: `quomodo` (production) from `wrangler.jsonc`
- Preview environment: `env.preview` (`quomodo-preview`)
- Build/deploy commands: `npm run build`, `npx wrangler deploy`

## Required Access and Tooling

- Node.js + npm
- Cloudflare account access for the `quomodo` worker
- `CLOUDFLARE_API_TOKEN` with Workers Scripts + Workers Secrets permissions
- Wrangler auth via either:
  - `npx wrangler login`, or
  - `CLOUDFLARE_API_TOKEN` in shell / `.env.local`

## Required Environment Variables

These must be set locally (shell or `.env.local`) before syncing secrets:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PRIVATE_SUPABASE_SERVICE_ROLE`
- `PRIVATE_STRIPE_API_KEY`

## Pre-Deploy Checks

```bash
npm ci
npm run check
npm run build
```

## Sync Secrets (Production + Preview)

```bash
# Reads .env.local when present.
npm run cf:secrets:sync
```

Verify both environments include all required keys:

```bash
npx wrangler secret list
npx wrangler secret list --env preview
```

## Deploy Preview

```bash
npx wrangler deploy --env preview
```

## Verify Preview

- Open preview URL from Wrangler output and verify critical `/app/*` routes load.
- Optional deployed smoke run (if smoke credentials are configured):

```bash
SMOKE_BASE_URL=<preview-url> npm run smoke:deployed
```

## Deploy Production

```bash
npx wrangler deploy
```

## Verify Production

- Open the canonical production URL (`https://systemscraft.co`).
- Validate:
  - login
  - CRUD (roles/systems/processes/actions)
  - portal traversal links
  - search endpoint and deep links
  - flags creation/visibility
  - billing route access
- Optional deployed smoke run:

```bash
SMOKE_BASE_URL=https://systemscraft.co npm run smoke:deployed
```

## Rollback Strategy

If a release is bad, redeploy the last known good commit:

```bash
git checkout <known-good-commit>
npm ci
npm run build
npx wrangler deploy
git checkout -
```

Notes:

- Secrets are environment-level. Re-sync only if secret values changed.
- Prefer rollback by re-deploying a known-good commit over ad hoc manual edits.
- Keep launch docs Cloudflare-only; do not add alternative hosting instructions in active release flow.
