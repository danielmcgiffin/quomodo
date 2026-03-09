# SystemsCraft Master Plan

Owner: Danny McGiffin  
Last updated: 2026-03-09  
Status: Active — single source of truth
Operation Glorious Eagle

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

Active findings intake:

- `plans/PRODUCT_FINDINGS.md` (ingested into backlog tasks M-18, M-19, and H-01..H-06)
- `plans/M11_AUDIT_FOLLOWUP_PLAN.md` (implementation sequence derived from the completed M-11 route audit)
- `plans/M20_TRIAD_CARD_PLAN.md` (implementation spec for atlas list-card content grammar after M-19)
- `plans/M21_FLAG_HISTORY_TIMELINE_PLAN.md` (implementation spec for EPI-169 resolved-history timeline tab)
- Performance + correctness audit TODOs (2026-03-06) ingested as `TODO-01`..`TODO-10` in Section 4.

---

## 3) Current State Snapshot

### Recent completed commits

- `3db3caa` — launch smoke/onboarding hardening
- `d74bcf0` — authenticated E2E prerequisites enforced in local/CI
- `f936988` — legacy Cursus booking-link cleanup in marketing
- `58ed3f7` — catch-all working-tree snapshot for fresh branch state
- `f9d22ed` — switched active brand assets to `systemscraft.jpeg`
- App-shell visual tokens aligned with SystemsCraft marketing palette (White/Onyx/Pine/Copper)
- E2E Supabase setup script hardened for GitHub runner IPv6/COMING_UP failures (pooler-first link + adaptive retries)
- `PUBLIC_BOOKING_URL` set in Cloudflare runtime secrets for both production (`quomodo`) and preview (`quomodo-preview`) to `https://tidycal.com/3zrxrkx/15-minute-meeting`
- RC branch `rc/launch-2026-03-03` cut from known-good SHA `f9d22ed` and deployed to production (`7ddf965b-27cd-49f5-954c-9e3da998fc2d`)
- GitHub Actions deploy workflow active for `quomodo` on push to `master` (`.github/workflows/deploy-cloudflare.yml`).
- Verified successful push-triggered deploy run `22771895394` (2026-03-06) producing worker deployment `087ee6cd-9f04-4259-98ce-f6f79453ec3c`.

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

- [x] **M-01** Set `PUBLIC_BOOKING_URL` in preview + production runtime env.
- [x] **M-02** Add required authenticated E2E secrets in GitHub:
  - `E2E_EMAIL`
  - `E2E_PASSWORD`
  - `E2E_PUBLIC_SUPABASE_URL`
  - `E2E_PUBLIC_SUPABASE_ANON_KEY`
  - `E2E_PRIVATE_SUPABASE_SERVICE_ROLE`
  - `E2E_PRIVATE_STRIPE_API_KEY` (optional but recommended)
- [x] **M-03** Authenticated E2E coverage confirmed through GitHub-backed secreted runs:
  - `node scripts/require-e2e-env.mjs`
  - `npm run seed:e2e`
  - `npm run test:e2e`
- [x] **M-04** Confirm CI runs authenticated E2E suites (not just marketing smoke).
- [x] **M-05** Cut RC branch from known-good SHA and deploy.
- [x] **M-06** Post-deploy verification on production:
  - smoke + onboarding scripts pass.
- [x] **M-07** Confirm production DB schema-cleanup migration status (if uncertain, run verification queries before launch demos/sales calls).
- [x] **M-17** Restore push-triggered Cloudflare production deploy from `master` (GitHub Actions + `wrangler deploy`).
  - Verified via successful Actions run `22771895394` and Cloudflare deployment `087ee6cd-9f04-4259-98ce-f6f79453ec3c`.

## P1 — Demo / Conversion Critical

- [x] **M-08** Flags visibility + dashboard UX refresh.
  - [x] **M-08a** Removed per-page flag sidebars and added inline primary-entity counts.
  - [x] **M-08b** Add modal-first direct/related flag indicators + `/app/flags` filtering/deep-link support.
  - Plan: `plans/FLAG_VISIBILITY_PASS_B_PLAN.md`
- [x] **M-09** Ensure logout UX and correctness in app flow.
  - [x] **M-09a** Add/logout button where missing in app UX flow.
  - [x] **M-09b** Fix sign-out correctness bug on `/account/sign_out` (maps to `TODO-10`).
- [ ] **M-10** Build script to fetch/store system logos into local DB workflow.
- [x] **M-11** Complete full route screen audit (desktop + mobile + interactive checks).
  - Follow-up plan: `plans/M11_AUDIT_FOLLOWUP_PLAN.md`
- [ ] **M-12** Implement production error reporting decision (Sentry vs admin-email strategy) and validate alert delivery.
- [ ] **M-13** Prepare and lock a high-quality demo workspace + secure demo credentials.
- [x] **M-18** Flag UX follow-up pass from `plans/PRODUCT_FINDINGS.md`.
  - [x] **M-18a** In flag modal, link to the flag origin (where it was created), not dashboard.
  - [x] **M-18b** Add resolved-flag history log with resolved-at timestamp and actor.
  - [x] **M-18c** On "Resolve", show a short comment textbox and persist the note.
  - [x] **M-18d** Place flag indicator icon next to item title after the link icon.
- [x] **M-19** Standardize all list pages so cards render in grid layouts.
- [x] **M-20** Standardize atlas list cards around triad-summary content.
  - Process cards now summarize title + roles + systems without long descriptions.
  - Role cards now summarize title + processes + systems without growing arbitrarily tall.
  - System cards now summarize title + owner + connected processes/roles in the same grammar.
  - Plan: `plans/M20_TRIAD_CARD_PLAN.md`
- [ ] **M-21** Upgrade `/app/flags` resolved history into a dedicated searchable timeline tab with sticky date rail (`EPI-169`).
  - Plan: `plans/M21_FLAG_HISTORY_TIMELINE_PLAN.md`
- [ ] **H-01** Fix inline editing to be seamless, like Notion.
- [ ] **H-02** Figure out and fix why Process Details takes so long to load (primary audit hooks: `TODO-01`, `TODO-03`, `TODO-08`).
- [x] **H-03** Fix Process Details slide-in title monstrosity.
- [ ] **H-04** Make app background match marketing-site background.
- [ ] **H-05** Fix plural noun rendering for singular counts (e.g., `1 Systems`).

## P2 — Hygiene / Post-Launch Risk Reduction

- [ ] **M-14** Decide whether to sanitize/remove Cursus references from `sample data.sql` (especially before external sharing).
- [ ] **M-15** Gap-fill any remaining mapper/helper unit tests not covered by current suite.
- [ ] **M-16** Run Svelte 5 compatibility warning audit and clean remaining warnings.
- [ ] **H-06** Make sure shared UI is componentized/tokenized as much as possible.

## Performance & Correctness TODOs (Plausible vs Correct audit)

### Perf-P0 — Request Waterfall (first-load latency)

- [ ] **TODO-01** Parallelize flags query in process detail loader.
  - File: `src/routes/app/processes/[slug]/+page.server.ts`
  - Move flags query into existing `Promise.all(...)` batch (it depends on `orgId`, not action/role/system results).
  - Impact: removes one round-trip on process detail first load (~50-150ms).
- [ ] **TODO-02** Parallelize `getUser()` and MFA AAL check in `safeGetSession`.
  - File: `src/hooks.server.ts`
  - Use `Promise.all([supabase.auth.getUser(), supabase.auth.mfa.getAuthenticatorAssuranceLevel()])` after session null-check.
  - Impact: removes one round-trip on every authenticated request (~50-150ms).
- [ ] **TODO-03** Collapse `ensureOrgContext` into a single query.
  - File: `src/lib/server/atlas.ts`
  - Replace sequential `org_members` + `orgs` fetch with join/RPC returning org membership + org name together.
  - Impact: removes one round-trip on every authenticated request.
- [ ] **TODO-04** Collapse layout workspace name lookup into membership query.
  - Files: `src/routes/app/+layout.server.ts`, `src/routes/(admin)/account/+layout.server.ts`
  - Join org name onto membership lookup (or reuse same RPC as TODO-03).
  - Impact: removes one round-trip on layout loads.

### Perf-P1 — Algorithmic fixes

- [ ] **TODO-05** Use `sc_resequence_actions` RPC for action insertion.
  - File: `src/lib/server/app/actions/shared.ts` (`createOrUpdateActionRecord`)
  - Replace N sequential sequence-shift updates with one resequence RPC call.
  - Impact: scales better for larger processes (20+ actions).
- [ ] **TODO-06** Replace auth-user pagination with profile-based email lookup.
  - File: `src/routes/app/team/+page.server.ts` (`loadAuthEmailsById`)
  - Stop scanning all auth users; persist/query email on `profiles` (or a dedicated lookup table).
  - Impact: eliminates O(total_users) pagination calls on team page.

### Perf-P2 — Compound overhead

- [ ] **TODO-07** Consolidate nav count queries into one RPC.
  - Files: `src/routes/app/+layout.server.ts`, `src/routes/(admin)/account/+layout.server.ts`
  - Add `sc_nav_counts(p_org_id uuid)` returning processes/roles/systems/flags counts in one call.
  - Impact: 4 round-trips → 1.
- [ ] **TODO-08** Scope open-flag fetching to relevant entity IDs.
  - Files: process/role/system detail and list loaders using open-flag index builds.
  - Filter in SQL using `.in('target_id', [...ids])` where possible; avoid org-wide open-flag payloads.
  - Impact: reduces payload and memory overhead at higher flag volumes.
- [ ] **TODO-09** Add `.limit()` (or count-only path) to unbounded list-page flag queries.
  - Files: `src/routes/app/processes/+page.server.ts`, `src/routes/app/roles/+page.server.ts`, `src/routes/app/systems/+page.server.ts`
  - Cap payload size or fetch only counts for badges until detail modal opens.
  - Impact: caps worst-case payload growth.

### Perf-P3 — Correctness

- [x] **TODO-10** Fix logout bug (cannot sign out), tracked under `M-09`.
  - Likely focus: `src/routes/(admin)/account/sign_out/+page.svelte` + account layout client hydration handoff.

---

## 5) Execution Order

1. M-01 → M-04 (environment + E2E enforcement fully active)
2. M-05 → M-07 + M-17 (release candidate + deploy + production verification + deploy automation)
3. M-08 → M-13 + M-18 + M-19 + M-20 + M-21 + H-01 → H-05 (demo/sales reliability + UX follow-up)
   - Audit-derived UI polish order: `M-19` → `M-20` → `H-03` → `M-18` → `M-21` → `H-05`
4. M-14 → M-16 + H-06 (cleanup backlog + component/token hardening)
5. Performance/correctness lane (non-revenue-blocking, high leverage):
   - First wave: TODO-10 → TODO-02 → TODO-01 → TODO-03
   - Follow-up wave: TODO-04 → TODO-09 as capacity allows

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
- flags/dashboard UX follow-up + PRODUCT_FINDINGS tasks (M-18/M-19, H-01, H-03, H-04, H-05)
- data-layer test gap fill

### Advanced ownership

- production error-reporting strategy + implementation
- performance root-cause work on heavy routes (H-02, TODO-01..TODO-04, TODO-07..TODO-09)
- algorithmic data-path refactors (`sc_resequence_actions`, auth-email lookup) (TODO-05, TODO-06)
- broad Svelte compatibility sweeps across shared components + tokenization/componentization hardening (H-06)
- cross-cutting infra/security-sensitive changes

---

## 8) Archive Index

Historical docs moved to `plans/archive/` to avoid split planning sources.

If scope changes or tasks complete, update this file in the same change.
