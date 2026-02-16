# SystemsCraft Master Plan

Owner: Claude (PM) + Danny McGiffin (Founder)
Last updated: 2026-02-14
Status: Active — single source of truth for all project planning

---

## 1. Product Overview

SystemsCraft is a SaaS tool for mapping organizational roles, systems, processes, and actions. Customers use it to build an operational atlas — a living document of how their business works.

**Stack**: SvelteKit 2 + Svelte 5 / Supabase (PostgreSQL + Auth) / Stripe / Cloudflare Workers / Resend email / TailwindCSS + DaisyUI

**Domain**: `https://systemscraft.co`

---

## 2. What's Done

Everything below is shipped, deployed, and validated.

### Core Product (shipped pre-2026-02-13)

- Triad data model: roles, systems, processes, actions, flags — full CRUD
- RBAC + RLS enforcement: `owner / admin / editor / member`
- Portal traversal across all entity types
- Search (`Ctrl-?`, grouped results, deep links)
- Rich text editor (TipTap) with safety guardrails
- Email delivery (Resend) — welcome, invite, transfer, admin notifications

### Launch Readiness (shipped 2026-02-13)

- `LP-065` Production domain + auth callback alignment
- `LP-066` Live Stripe catalog (Basic + Growth plans, live keys)
- `LP-067` Production email deliverability (Supabase SMTP + Resend)
- `LP-068` First-customer onboarding validation (full path PASS)
- `LP-069` Multi-user workspace provisioning (admin/editor/member PASS)
- `LP-075` Workspace lifecycle UX (create, rename, first-workspace bootstrap)
- `LP-076` Multi-workspace support (switcher, stable cookie context)
- `LP-077` Team management (`/app/team` — member list, role changes, removal)
- `LP-078` Stored invite flow (persist, revoke, accept — new and existing users)
- `LP-079` Ownership transfer + consultant leave/stay path
- `LP-080` Per-workspace billing (lapsed=read-only, owner-only reactivation)

### Codebase Cleanup (shipped 2026-02-14)

- `EPI-28` Baseline metrics captured
- `EPI-29` DB schema cleanup migration prepared (merge/enforce/drop fields)
- `EPI-30` Process + action CRUD extracted to shared helpers (-341 lines from process server)
- `EPI-31` Flags route consolidated to shared action helpers
- `EPI-32` `wrapAction` utility eliminates repeated boilerplate
- `EPI-34` Process detail page componentized (502 → 144 lines)
- `EPI-35` DB types regenerated, app typing fixed
- `EPI-36` Systems + roles detail pages componentized (427 → ~255, 367 → ~233)

### Founder Decisions (Locked)

1. Billing: per-workspace, owner is billing authority
2. Ownership transfer: owner-only initiation, recipient must be verified admin
3. Lapsed policy: view-only for all roles, invites blocked, owner-only reactivation
4. Consultant post-handoff: prior owner stays admin/editor or leaves
5. Invites: stored records (not stateless links)
6. Hosting: Cloudflare Workers only
7. Rich text: TipTap
8. RBAC roles: `owner / admin / editor / member`

---

## 3. Current State (2026-02-14)

### Quality Gates

- `npm run check`: PASS (0 errors, 0 warnings)
- `npm run lint`: PASS
- `npm run build`: PASS
- `npm run test_run`: PASS (42 tests, 10 files)

### Codebase Metrics

| Metric                | Baseline (pre-cleanup) | Current | Delta |
| --------------------- | ---------------------- | ------- | ----- |
| App route total lines | 5521                   | 4284    | -1237 |
| Shared server modules | 2194                   | 3032    | +838  |
| Component lines       | 1971                   | 2781    | +810  |
| Unit tests            | 42                     | 42      | 0     |
| E2E tests             | 0                      | 0       | 0     |

**Read**: Lines moved from routes → shared modules + components. Net code is cleaner, not bigger.

### Uncommitted Work

There are uncommitted changes on `master`:

- `RoleDetailHeader.svelte` and `SystemDetailHeader.svelte` (new components from EPI-36)
- Roles/systems detail page refactors
- `DatabaseDefinitions.ts` update
- Migration file rename

---

## 4. Forward Plan — Path to Saleable

### What "Saleable" Means

1. A demo doesn't hit embarrassing bugs or broken screens
2. A paying customer can self-serve without founder intervention
3. When production breaks, you know before the customer tells you
4. A junior dev or AI agent can ship changes without breaking things
5. Legal basics are covered for enterprise procurement

### Gap Analysis

| Gap                                  | Impact                                    | Priority |
| ------------------------------------ | ----------------------------------------- | -------- |
| No E2E tests                         | Deploys can break critical paths silently | P0       |
| DB migration not applied to prod     | Type mismatches possible                  | P0       |
| Uncommitted work on master           | Risk of lost work                         | P0       |
| No Terms of Service / Privacy Policy | Enterprise prospects bounce               | P0       |
| Unit test coverage thin (42 tests)   | Silent regressions in shared logic        | P1       |
| Flag UX rough edges                  | Demo friction                             | P1       |
| No error monitoring                  | Blind to production failures              | P1       |
| Screen audit not done                | Broken screens found live                 | P1       |
| Remaining cleanup (Svelte 5 compat)  | Future breakage on Svelte updates         | P2       |

---

## 5. Tickets

### Phase 1: Ship What's Built (P0) — Do First

#### SR-01: Commit and deploy EPI-36 work

**What**: Land the uncommitted componentization changes.
**Steps**:

1. `git add` the specific changed/new files:
   - `src/lib/components/RoleDetailHeader.svelte`
   - `src/lib/components/SystemDetailHeader.svelte`
   - `src/routes/app/roles/[slug]/+page.svelte`
   - `src/routes/app/systems/[slug]/+page.svelte`
   - `src/DatabaseDefinitions.ts`
   - `supabase/migrations/20260213000000_schema_cleanup_fields.sql` (rename)
   - `plans/human/database-schema-cleanup-self-guide.md`
   - `plans/human/todo.md`
2. Run quality gates: `npm run check && npm run lint && npm run build && npm run test_run`
3. Commit referencing EPI-36
4. Deploy: `npx wrangler deploy`
5. Smoke: `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed`

**Done when**: Deployed, smoke passes.

#### SR-02: Apply DB schema cleanup to production

**What**: Run the prepared migration against production Supabase.
**Steps**:

1. Take DB backup (Supabase Dashboard → Settings → Backups)
2. Open Supabase SQL editor, paste contents of `supabase/migrations/20260213000000_schema_cleanup_fields.sql`
3. Execute
4. Verify columns dropped:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'roles';
   -- Should NOT contain person_name or hours_per_week
   SELECT column_name FROM information_schema.columns WHERE table_name = 'systems';
   -- Should NOT contain url
   ```
5. Manual smoke: create a role, system, and process in production — no errors

**Done when**: Migration applied, app works against new schema.

---

### Phase 2: E2E Test Safety Net (P0) — Before Any More Code Changes

#### SR-03: Set up Playwright

**What**: Install Playwright, configure for SvelteKit, add to CI.
**Steps**:

1. `npm install -D @playwright/test`
2. `npx playwright install chromium`
3. Create `playwright.config.ts`:
   ```typescript
   import { defineConfig } from "@playwright/test"
   export default defineConfig({
     testDir: "./e2e",
     webServer: {
       command: "npm run build && npm run preview",
       port: 4173,
       reuseExistingServer: !process.env.CI,
     },
     use: {
       baseURL: "http://localhost:4173",
     },
   })
   ```
4. Add scripts to `package.json`:
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui"
   ```
5. Create `e2e/` directory with a placeholder test
6. Add `test-results/` and `playwright-report/` to `.gitignore`
7. Add Playwright step to `.github/workflows/tests.yml`

**Done when**: `npm run test:e2e` runs without errors.

#### SR-04: E2E — Marketing pages smoke

**What**: Verify public pages render without 500s.
**File**: `e2e/marketing.spec.ts`
**Test cases**:

- `GET /` → 200, contains headline text
- `GET /pricing` → 200, contains plan names
- `GET /method` → 200
- `GET /contact` → 200
- `GET /login/sign_in` → 200, sign-in form present
- `GET /login/sign_up` → 200, sign-up form present

**Done when**: All pass in CI.

#### SR-05: E2E — Authenticated app smoke

**What**: Log in as test user, verify all core app pages load.
**Prereqs**: Dedicated test user `e2e-test@systemscraft.co` with pre-seeded workspace. Credentials in `.env.test` (gitignored) + CI secrets.
**File**: `e2e/app-smoke.spec.ts`
**Test cases**:

1. Sign in via `/login/sign_in`
2. Assert redirect to `/app/processes`
3. Visit `/app/roles` → page loads
4. Visit `/app/systems` → page loads
5. Visit `/app/processes` → page loads
6. Visit `/app/flags` → page loads
7. Visit `/app/workspace` → page loads
8. Visit `/app/team` → page loads

**Done when**: Full authenticated smoke passes.

#### SR-06: E2E — CRUD happy path

**What**: Create a role, system, and process end-to-end.
**File**: `e2e/crud-happy-path.spec.ts`
**Test cases**:

1. Log in
2. Create role → assert detail page renders with correct name
3. Create system → assert detail page renders
4. Create process (with trigger + end_state) → assert detail page renders
5. Cleanup: delete created entities or use isolated test workspace

**Done when**: Full CRUD cycle passes.

#### SR-07: E2E — Billing gate enforcement

**What**: Verify lapsed workspaces are read-only in the browser.
**File**: `e2e/billing-gate.spec.ts`
**Prereqs**: Test workspace fixture with `billing_state = 'lapsed'`
**Test cases**:

1. Log in as lapsed-workspace user
2. Assert lapsed banner visible
3. Assert create buttons disabled/hidden
4. Assert invite button disabled/hidden

**Done when**: Lapsed enforcement verified.

---

### Phase 3: Legal Pages (P0)

#### SR-08: Add Terms of Service page

**What**: Create `/terms` route with ToS content.
**Steps**:

1. Create `src/routes/(marketing)/terms/+page.svelte`
2. Content must cover: service description, acceptable use, data ownership, liability, termination, governing law
3. Add link in marketing footer layout

**Done when**: `/terms` renders and is linked from footer.

#### SR-09: Add Privacy Policy page

**What**: Create `/privacy` route with privacy policy.
**Steps**:

1. Create `src/routes/(marketing)/privacy/+page.svelte`
2. Content must cover: data collected, usage, third-party processors (Supabase, Stripe, Cloudflare, Resend), cookies, user rights, contact
3. Add link in marketing footer layout

**Done when**: `/privacy` renders and is linked from footer.

---

### Phase 4: Unit Test Hardening (P1)

#### SR-10: Unit tests — wrapAction

**File**: `src/lib/server/app/actions/wrapAction.test.ts`
**Test cases**:

1. Returns `fail(403)` when permission check fails
2. Returns `fail(403)` when billing is lapsed and action needs active billing
3. Calls wrapped handler when permissions + billing pass
4. Returns handler result on success
5. Returns `fail(500)` with error ID when handler throws

**How**: Mock `ensureOrgContext` to return controlled context objects. Mock inner handler.

#### SR-11: Unit tests — directory mapper

**File**: `src/lib/server/app/mappers/directory.test.ts`
**Test cases**:

1. Maps role DB row → role list view model (correct fields)
2. Maps system DB row → system list view model
3. Maps process DB row → process list view model
4. Handles null/missing optional fields
5. Generates correct slugs

#### SR-12: Unit tests — detail-relations mapper

**File**: `src/lib/server/app/mappers/detail-relations.test.ts`
**Test cases**:

1. Groups related entities by type correctly
2. Handles empty relation sets
3. Returns correct structure for each portal type

#### SR-13: Unit tests — process mapper

**File**: `src/lib/server/app/mappers/processes.test.ts`
**Test cases**:

1. Maps process row + actions → detail view model
2. Sorts actions by `sort_order`
3. Handles process with zero actions
4. Includes trigger + end_state in output

#### SR-14: Expand RBAC edge case coverage

**File**: `src/lib/server/team-rbac.test.ts` (existing)
**Test cases to add**:

1. `editor` cannot manage anyone
2. `member` cannot manage anyone
3. `admin` cannot remove `owner`
4. `admin` can assign `editor`/`member` but not `admin`/`owner`
5. `owner` can assign any role except `owner`
6. Cannot change own role (all levels)

---

### Phase 5: UI Polish (P1)

#### SR-15: Fix flag button/modal pattern

**What**: Flag creation should use the same button → modal flow as role/system/process creation.
**Where**: `src/lib/components/InlineEntityFlagControl.svelte`, `src/lib/components/FlagsCreateForm.svelte`
**Verify**: Create a flag on a role, system, process, and action — all work consistently.

#### SR-16: Remove flag sidebar from flags list page

**What**: `/app/flags` shows a self-referential flag sidebar — remove it.
**Where**: `src/routes/app/flags/+page.svelte`

#### SR-17: Empty-state treatment for flag sidebars

**What**: When no flags exist, show a light green outline with thumbs-up icon and "All clear" text instead of empty space.
**Where**: `src/lib/components/FlagSidebar.svelte`
**Style**: DaisyUI `border-success/20` outline, centered icon.

#### SR-18: Full screen audit

**What**: Visit every route, verify no console errors, no layout breaks, interactive elements work, mobile (375px) doesn't break.
**Checklist**: Use the route list below. Log issues as sub-tickets. Fix blockers, defer cosmetics.

**Marketing**: `/`, `/method`, `/partners`, `/pricing`, `/contact`, `/search`, `/blog`, `/blog/[slug]`, `/terms`, `/privacy`
**Auth**: `/login/sign_in`, `/login/sign_up`, `/login/forgot_password`, `/invite/[token]`, `/transfer/[token]`
**App**: `/app/workspace`, `/app/team`, `/app/roles`, `/app/roles/[slug]`, `/app/systems`, `/app/systems/[slug]`, `/app/processes`, `/app/processes/[slug]`, `/app/flags`, `/app/search`
**Account**: `/account`, `/account/create-profile`, `/account/select-plan`, `/account/billing`, `/account/settings`, `/account/settings/edit-profile`, `/account/settings/change-email`, `/account/settings/change-password`, `/account/settings/delete-account`

---

### Phase 6: Production Observability (P1)

#### SR-19: Error reporting

**What**: Server errors must reach the founder within minutes.
**Recommended approach** (lightweight, no new vendor):

1. Extend `logRuntimeError()` in `src/lib/server/runtime-errors.ts` to call `sendAdminEmail()` for 500-level errors
2. Rate-limit: max 1 email per unique error per 5 minutes
3. Include: error message, request URL, user ID if available, timestamp

**Alternative** (more robust): Sentry (`@sentry/sveltekit`) with `PUBLIC_SENTRY_DSN` env var.

**Done when**: Throw a test error → you receive notification.

#### SR-20: Uptime monitoring

**What**: External health check on `https://systemscraft.co`.
**Steps**:

1. [x] Set up free monitor (UptimeRobot, BetterUptime, or Cloudflare Health Checks)
2. [x] Monitor `https://systemscraft.co` every 5 minutes
3. [x] Monitor `https://systemscraft.co/pricing` (verifies rendering, not just DNS)
4. [x] Alert to email/Slack

**Done when**: You get alerted if the site goes down.

---

### Phase 7: Remaining Cleanup (P2)

#### SR-21: Svelte 5 compatibility audit (→ EPI-47)

**What**: Fix deprecation warnings in shared components (`FlagSidebar.svelte`, `ScModal.svelte`, etc.).
**Steps**:

1. Run `npm run check` and filter for Svelte-specific warnings
2. Fix component API issues (props, events, slots → Svelte 5 patterns)
3. Verify 0 warnings after

#### SR-22: Data layer test coverage (→ EPI-48)

**What**: Cover any mappers/helpers NOT already tested by SR-10 through SR-14.
**Focus**: Gap-fill only — skip anything already covered.

#### SR-23: Final quality gates + baseline comparison (→ EPI-49)

**What**: Run all gates, compare against baseline, document the "after" state.
**Steps**:

1. `npm run check && npm run lint && npm run build && npm run test_run && npm run test:e2e`
2. Capture line counts (same `wc -l` commands as baseline)
3. Compare against baseline table in Section 3 of this document
4. Update the metrics table in this document

---

### Phase 8: Marketing + Demo Readiness (P2)

#### SR-24: Pricing page content review

**What**: Cross-reference page with live Stripe plans. Verify feature lists, CTAs, plan names, prices.
**Where**: `src/routes/(marketing)/pricing/`

#### SR-25: Homepage content review

**What**: Clear value prop, what the product does, who it's for, working CTA.
**Where**: `src/routes/(marketing)/+page.svelte`

#### SR-26: Prepare demo workspace

**What**: Pre-populated workspace with realistic data for live demos.
**Steps**:

1. Create demo org in production
2. Populate: 5-8 roles, 4-6 systems, 8-12 processes with realistic content
3. Add flags in various states
4. Create demo user with `editor` role
5. Store credentials securely (1Password etc.)

**Done when**: You can demo in under 5 minutes.

---

## 6. Execution Order

```
Phase 1: Ship what's built ─── SR-01, SR-02 (same day)
    │
Phase 2: Safety net ────────── SR-03, SR-04, SR-05, SR-06, SR-07
    │
Phase 3: Legal ─────────────── SR-08, SR-09 (parallel with Phase 2)
    │
Phase 4: Unit tests ────────── SR-10 through SR-14 (parallel with Phase 5)
    │
Phase 5: UI polish ─────────── SR-15, SR-16, SR-17, SR-18
    │
Phase 6: Observability ─────── SR-19, SR-20
    │
Phase 7: Cleanup ────────────── SR-21, SR-22, SR-23
    │
Phase 8: Marketing + demo ──── SR-24, SR-25, SR-26
```

---

## 7. Quality Gates (CI + Pre-Deploy)

Every PR must pass:

| Gate       | Command            | Expected               |
| ---------- | ------------------ | ---------------------- |
| Type check | `npm run check`    | 0 errors, 0 warnings   |
| Lint       | `npm run lint`     | 0 errors               |
| Build      | `npm run build`    | Success                |
| Unit tests | `npm run test_run` | All pass               |
| E2E tests  | `npm run test:e2e` | All pass (after SR-03) |

Pre-deploy (manual or scripted):

```bash
SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed
SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed
```

---

## 8. Deploy Runbook

**Cloudflare Workers is the only supported hosting target.**

### Required Secrets

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PRIVATE_SUPABASE_SERVICE_ROLE`
- `PRIVATE_STRIPE_API_KEY`
- `PRIVATE_RESEND_API_KEY` (optional)
- `PRIVATE_ADMIN_EMAIL` (optional)

### Deploy Flow

```bash
# Pre-checks
npm ci
npm run check
npm run build

# Sync secrets (reads .env.local)
npm run cf:secrets:sync

# Deploy preview
npx wrangler deploy --env preview

# Verify preview
SMOKE_BASE_URL=<preview-url> npm run smoke:deployed

# Deploy production
npx wrangler deploy

# Verify production
SMOKE_BASE_URL=https://systemscraft.co npm run smoke:deployed
```

### Rollback

```bash
git checkout <known-good-commit>
npm ci && npm run build && npx wrangler deploy
git checkout -
```

---

## 9. Metrics Targets

| Metric                       | Baseline (2026-02-14) | Target (post-plan) |
| ---------------------------- | --------------------- | ------------------ |
| App route lines              | 4284                  | Continue downward  |
| Unit tests                   | 42 (10 files)         | 70+ (15+ files)    |
| E2E tests                    | 0                     | 15+                |
| svelte-check errors          | 0                     | 0 (maintain)       |
| Time to detect prod error    | Unknown               | < 5 minutes        |
| Screens with blocking issues | Unknown               | 0                  |

---

## 10. Post-Launch Backlog (Explicitly Deferred)

These are out of scope until after commercial launch:

- `LP-070` Customer data telemetry gate
- `LP-071` Additional deterministic search quality improvements
- `LP-072` Documentation generation v1 (template-based)
- `LP-073` NLP search beta (hybrid lexical + semantic)
- `LP-074` Documentation generation v2 (LLM-assisted with citations + review)

---

## 11. Open Questions for Founder

1. **Error monitoring**: Sentry (richer, third-party) vs. email alerts (simpler, no vendor)?
2. **Legal content**: Draft yourself, use a generator (Termly.io etc.), or hire a lawyer?
3. **Demo workspace**: Specific customer scenario to model sample data after?
4. **Timeline**: Scheduled demos or sales conversations that set hard deadlines?

---

## 12. Linear Board Cleanup

The current board has overlapping epics. Recommended:

1. Keep **EPI-27** as active cleanup epic (correct sub-issues, most work done)
2. Mark **EPI-14** and all its duplicate children as Canceled
3. Create new **Sales Readiness** project for SR-01 through SR-26
4. Keep **EPI-47, EPI-48, EPI-49** (mapped to SR-21, SR-22, SR-23)
5. Mark remaining duplicate/stale issues as Canceled

---

_This is the single source of truth. All previous planning documents are archived in `plans/archive/`._
