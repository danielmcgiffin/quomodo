# Independent Launch Readiness — Self Guide

Owner: Danny  
Updated: 2026-03-02

This guide covers the final three launch-prep items:

1. Remove Cursus-branded external touchpoints.
2. Enforce authenticated E2E in local + CI.
3. Cut and deploy from a clean release candidate SHA.

---

## 1) Remove remaining Cursus links

### Verify no Cursus branding remains in app/marketing source

```bash
cd /srv/dev/quomodo
rg -n "danny-cursus|cursus\.tools|@cursus" src
```

Expected: no matches.

### Booking link source of truth

`src/lib/marketing/site.ts` now uses:

- `PUBLIC_BOOKING_URL` (if provided)
- fallback: `/contact_us`

Set your booking URL explicitly in runtime env:

```bash
PUBLIC_BOOKING_URL="https://cal.com/<your-handle>/15min"
```

---

## 2) Enforce authenticated E2E (local + CI)

### Required env values

- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_PUBLIC_SUPABASE_URL`
- `E2E_PUBLIC_SUPABASE_ANON_KEY`
- `E2E_PRIVATE_SUPABASE_SERVICE_ROLE`

### Local preflight

```bash
cd /srv/dev/quomodo
node scripts/require-e2e-env.mjs
```

Expected: `E2E environment check passed.`

### Run authenticated E2E locally

```bash
npm run seed:e2e
npm run test:e2e
```

Notes:

- Authenticated specs (`app-smoke`, `crud-happy-path`, `billing-gate`) now require creds and will fail fast if missing.
- `marketing.spec.ts` remains your public-page smoke.

### CI setup (GitHub repo secrets)

Add these secrets in repository settings:

- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_PUBLIC_SUPABASE_URL`
- `E2E_PUBLIC_SUPABASE_ANON_KEY`
- `E2E_PRIVATE_SUPABASE_SERVICE_ROLE`
- `E2E_PRIVATE_STRIPE_API_KEY` (optional fallback exists)

`/.github/workflows/tests.yml` now validates these before seeding/running Playwright.

---

## 3) Cut clean release candidate and deploy from known SHA

### A. Snapshot current state

```bash
cd /srv/dev/quomodo
git status --short
git log --oneline -n 20
```

Launch-gate hardening commit: `3db3caa`.

### B. Create clean RC branch from chosen SHA

```bash
git switch --detach <known-good-sha>
git switch -c release/<yyyy-mm-dd>-own-shop-rc
```

### C. Apply only intended release commits/cherry-picks

Example:

```bash
git cherry-pick 3db3caa
# cherry-pick additional approved launch commits as needed
```

### D. Run full release gates

```bash
npm run check
npm run lint
npm run build
npm run test_run
npm run test:e2e
SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed
SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed
```

### E. Deploy + post-deploy verify

```bash
npx wrangler deploy
SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed
SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed
```

### F. Tag the deployed SHA

```bash
git tag -a rc-<yyyy-mm-dd>-own-shop -m "Own-shop launch candidate"
```

---

## Exit criteria (true GO)

- No Cursus links in `src/**`.
- Authenticated E2E runs (not skipped) in CI.
- Deployment made from a clean RC branch/SHA with all gates green.
