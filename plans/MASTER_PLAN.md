# SystemsCraft Master Plan

Owner: Danny McGiffin  
Last updated: 2026-03-02  
Status: Active — single source of truth

---

## 1) Purpose

This is the consolidated planning document for SystemsCraft.
All active planning, sequencing, and launch chores live here.

---

## 2) Consolidated Sources

This plan now consolidates and supersedes the following docs (now archived):

- `plans/archive/SALES_READINESS_PLAN.md`
- `plans/archive/SR_WORK_OWNERSHIP_GUIDE.md`
- `plans/archive/human-todo.md`
- `plans/archive/database-schema-cleanup-self-guide.md`

Active supporting runbook (kept active):

- `plans/human/independent-launch-readiness-self-guide.md`

---

## 3) Current State Snapshot

### Recent completed commits

- `3db3caa` — launch smoke/onboarding hardening
- `d74bcf0` — authenticated E2E prerequisites enforced in local/CI
- `f936988` — legacy Cursus booking-link cleanup in marketing
- `58ed3f7` — catch-all working-tree snapshot for fresh branch state
- App-shell visual tokens aligned with SystemsCraft marketing palette (White/Onyx/Pine/Copper)
- E2E Supabase setup script hardened for GitHub runner IPv6/COMING_UP failures (pooler-first link + adaptive retries)

### Verified technical baseline

- `npm run check` → PASS
- `npm run lint` → PASS
- `npm run build` → PASS
- `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed` → PASS
- `SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed` → PASS

### Important caveat

Authenticated Playwright suites now fail fast if E2E credentials/secrets are missing (intentional).

---

## 4) Master Chore List (Consolidated)

## P0 — Launch/Cashflow Critical

- [ ] **M-01** Set `PUBLIC_BOOKING_URL` in preview + production runtime env.
- [ ] **M-02** Add required authenticated E2E secrets in GitHub:
  - `E2E_EMAIL`
  - `E2E_PASSWORD`
  - `E2E_PUBLIC_SUPABASE_URL`
  - `E2E_PUBLIC_SUPABASE_ANON_KEY`
  - `E2E_PRIVATE_SUPABASE_SERVICE_ROLE`
  - `E2E_PRIVATE_STRIPE_API_KEY` (optional but recommended)
- [ ] **M-03** Run authenticated E2E locally (no skips):
  - `node scripts/require-e2e-env.mjs`
  - `npm run seed:e2e`
  - `npm run test:e2e`
- [ ] **M-04** Confirm CI runs authenticated E2E suites (not just marketing smoke).
- [ ] **M-05** Cut RC branch from known-good SHA and deploy.
- [ ] **M-06** Post-deploy verification on production:
  - smoke + onboarding scripts pass.
- [ ] **M-07** Confirm production DB schema-cleanup migration status (if uncertain, run verification queries before launch demos/sales calls).

## P1 — Demo / Conversion Critical

- [ ] **M-08** Flags dashboard refresh: centered main body + filterable grid.
- [ ] **M-09** Add logout button where missing in app UX flow.
- [ ] **M-10** Build script to fetch/store system logos into local DB workflow.
- [ ] **M-11** Complete full route screen audit (desktop + mobile + interactive checks).
- [ ] **M-12** Implement production error reporting decision (Sentry vs admin-email strategy) and validate alert delivery.
- [ ] **M-13** Prepare and lock a high-quality demo workspace + secure demo credentials.

## P2 — Hygiene / Post-Launch Risk Reduction

- [ ] **M-14** Decide whether to sanitize/remove Cursus references from `sample data.sql` (especially before external sharing).
- [ ] **M-15** Gap-fill any remaining mapper/helper unit tests not covered by current suite.
- [ ] **M-16** Run Svelte 5 compatibility warning audit and clean remaining warnings.

---

## 5) Execution Order

1. M-01 → M-04 (environment + E2E enforcement fully active)
2. M-05 → M-07 (release candidate + deploy + production verification)
3. M-08 → M-13 (demo/sales reliability improvements)
4. M-14 → M-16 (cleanup backlog)

---

## 6) Standard Verification Commands

```bash
npm run check
npm run lint
npm run build
npm run test_run
npm run test:e2e
SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed
SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed
```

---

## 7) Ownership Guidance (Consolidated)

### Junior can own (solo)

- legal page content updates
- uptime monitoring checks
- pricing/homepage content QA
- final quality gate reruns + reporting

### Junior with review

- demo workspace preparation
- flags dashboard UX/state refresh
- data-layer test gap fill

### Advanced ownership

- production error-reporting strategy + implementation
- broad Svelte compatibility sweeps across shared components
- cross-cutting infra/security-sensitive changes

---

## 8) Archive Index

Historical docs moved to `plans/archive/` to avoid split planning sources.

If scope changes or tasks complete, update this file in the same change.
