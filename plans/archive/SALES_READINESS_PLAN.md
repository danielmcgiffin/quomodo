# SystemsCraft — Sales Readiness Plan

Last updated: 2026-02-14
Owner: Danny McGiffin
Status: Draft — awaiting founder approval

## Situation

V1 feature work is **complete** (LP-065 through LP-080 all shipped 2026-02-13). Codebase cleanup is **partially done** (EPI-28 through EPI-36 closed, ~953 lines removed). Quality gates pass: 0 `svelte-check` errors, 42 unit tests green, build clean.

**The product works.** But "works" and "saleable" are different. This plan closes the gap.

## What "Saleable" Means (Definition)

A product is saleable when:

1. A prospect demo doesn't hit embarrassing bugs or broken screens
2. A paying customer can self-serve without founder intervention
3. When something breaks in production, you know about it before the customer tells you
4. A junior dev (or AI agent) can ship fixes and features without breaking things
5. Legal basics are covered so enterprises don't bounce at procurement

## Gap Analysis

| Area | Current State | Gap | Risk if Unaddressed |
|------|--------------|-----|---------------------|
| **E2E testing** | 0 Playwright tests | No automated regression on critical paths | Deploys break signup/billing and you find out from customers |
| **Unit test coverage** | 42 tests across 10 files | Shared actions, mappers, RBAC partially covered | Refactoring introduces silent bugs |
| **UI polish** | Flag UX issues noted in todo.md | Rough edges on flag sidebar, empty states | Demo friction, support tickets |
| **Screen audit** | Not done | No systematic check of all ~40 screens | Broken/ugly screens discovered live |
| **Error monitoring** | `console.error` only | No alerting, no error aggregation | Blind to production failures |
| **Legal pages** | None visible | No Terms of Service, Privacy Policy | Enterprise prospects bounce |
| **DB migration** | Schema cleanup SQL prepared, not applied to prod | Stale columns in production DB | Type mismatches, confusion |
| **Remaining cleanup** | EPI-43–49 in backlog | Some duplication remains in loaders | Slower dev velocity, harder onboarding |

## Prioritized Workstreams

### Priority Legend

- **P0 — Ship blocker**: Must complete before accepting money
- **P1 — Demo blocker**: Must complete before scheduled prospect demos
- **P2 — Quality of life**: Do soon, but won't lose a deal today
- **P3 — Foundation**: Investment that pays off over weeks

---

### WS-A: Commit + Deploy Current Work (P0)

**Why**: There are uncommitted changes on `master` (EPI-36 componentization of roles/systems detail pages, DB type updates). These need to land.

**Tickets:**

#### SR-01: Commit and deploy EPI-36 componentization work
- **What**: Stage the current uncommitted changes (RoleDetailHeader, SystemDetailHeader, roles/systems detail page refactors, DatabaseDefinitions update, migration rename)
- **How**:
  1. `git add` the specific changed files
  2. Commit with message referencing EPI-36
  3. Run quality gates: `npm run check && npm run lint && npm run build && npm run test_run`
  4. Deploy: `npx wrangler deploy`
  5. Run deployed smoke: `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed`
- **Done when**: Deployed to production, smoke passes

#### SR-02: Apply DB schema cleanup migration to production
- **What**: Run `20260213000000_schema_cleanup_fields.sql` against production Supabase
- **How**:
  1. Take a DB backup via Supabase dashboard (Settings → Backups)
  2. Open Supabase SQL editor
  3. Paste and run the migration SQL (it's already in the repo)
  4. Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'roles';` — should NOT contain `person_name` or `hours_per_week`
  5. Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'systems';` — should NOT contain `url`
  6. Deploy app (if not already deployed after SR-01)
  7. Manual smoke: create a role, system, and process in prod — confirm no errors
- **Done when**: Migration applied, app works against new schema

---

### WS-B: E2E Test Suite — Critical Path Coverage (P0)

**Why**: This is the single highest-value testing investment. Playwright tests exercise the real app in a browser. They catch regressions that unit tests can't — broken forms, auth redirects, billing flows, UI rendering.

**Tickets:**

#### SR-03: Set up Playwright infrastructure
- **What**: Install Playwright, configure for SvelteKit, add npm scripts, add to CI
- **How**:
  1. `npm install -D @playwright/test`
  2. `npx playwright install chromium` (just one browser to start)
  3. Create `playwright.config.ts`:
     ```typescript
     import { defineConfig } from '@playwright/test';
     export default defineConfig({
       testDir: './e2e',
       webServer: {
         command: 'npm run build && npm run preview',
         port: 4173,
         reuseExistingServer: !process.env.CI,
       },
       use: {
         baseURL: 'http://localhost:4173',
       },
     });
     ```
  4. Add to `package.json` scripts:
     ```json
     "test:e2e": "playwright test",
     "test:e2e:ui": "playwright test --ui"
     ```
  5. Create `e2e/` directory
  6. Add Playwright CI step to `.github/workflows/tests.yml` (after unit tests)
  7. Add `test-results/` and `playwright-report/` to `.gitignore`
- **Verification**: `npm run test:e2e` runs (even with 0 tests) without errors
- **Done when**: Playwright runs in CI and locally

#### SR-04: E2E — Marketing pages load without errors
- **What**: Smoke-test that public pages render (no 500s, key content visible)
- **How**: Create `e2e/marketing.spec.ts`:
  - `GET /` → status 200, contains "SystemsCraft" (or your headline text)
  - `GET /pricing` → status 200, contains plan names
  - `GET /method` → status 200
  - `GET /contact` → status 200
  - `GET /login/sign_in` → status 200, contains sign-in form
  - `GET /login/sign_up` → status 200, contains sign-up form
- **Done when**: All assertions pass, test in CI

#### SR-05: E2E — Authenticated app smoke test
- **What**: Log in with a test user, verify core app pages load
- **Prereqs**: Create a dedicated test user in Supabase (e.g. `e2e-test@systemscraft.co`) with a known password and a pre-seeded workspace. Store credentials in `.env.test` (gitignored) and CI secrets.
- **How**: Create `e2e/app-smoke.spec.ts`:
  1. Navigate to `/login/sign_in`
  2. Fill email + password, submit
  3. Assert redirect to `/app/processes` (or wherever post-login lands)
  4. Navigate to `/app/roles` → assert page loads, heading visible
  5. Navigate to `/app/systems` → assert page loads
  6. Navigate to `/app/processes` → assert page loads
  7. Navigate to `/app/flags` → assert page loads
  8. Navigate to `/app/workspace` → assert page loads
  9. Navigate to `/app/team` → assert page loads (if test user is owner/admin)
- **Done when**: Full authenticated smoke passes in CI

#### SR-06: E2E — CRUD happy path (create role, system, process)
- **What**: Test the primary user workflow end-to-end
- **How**: Create `e2e/crud-happy-path.spec.ts`:
  1. Log in as test user
  2. Navigate to `/app/roles`, click "Create Role"
  3. Fill name + description, submit
  4. Assert redirect to new role detail page, name visible
  5. Navigate to `/app/systems`, click "Create System"
  6. Fill name + description + location, submit
  7. Assert redirect to new system detail page
  8. Navigate to `/app/processes`, click "Create Process"
  9. Fill name + trigger + end_state, submit
  10. Assert redirect to new process detail page, trigger + end_state visible
  11. **Cleanup**: Delete created entities (or use a fresh workspace per test run via seed script)
- **Done when**: Full CRUD cycle passes

#### SR-07: E2E — Billing gate enforcement
- **What**: Verify lapsed workspaces are read-only
- **How**: Create `e2e/billing-gate.spec.ts`:
  1. Log in as a user whose workspace is in `lapsed` billing state (requires test fixture)
  2. Navigate to `/app/processes` → page loads, lapsed banner visible
  3. Attempt to create a process → assert it fails / create button disabled
  4. Navigate to `/app/team` → assert invite button is disabled/hidden
- **Note**: This test needs a workspace with `billing_state = 'lapsed'` in the test DB. Add this to the seed script.
- **Done when**: Lapsed enforcement verified in browser

---

### WS-C: Unit Test Hardening (P1)

**Why**: The extracted shared helpers (`wrapAction`, `createRoleRecord`, `createSystemRecord`, etc.) and mappers are now the single source of truth. If they break, every route breaks. Lock their behavior with tests.

**Tickets:**

#### SR-08: Unit tests for wrapAction utility
- **What**: Test the `wrapAction` wrapper in `src/lib/server/app/actions/`
- **Test cases**:
  1. Returns `fail(403)` when permission check fails
  2. Returns `fail(403)` when billing is lapsed and action requires active billing
  3. Calls the wrapped handler when permissions + billing pass
  4. Returns the handler's result on success
  5. Returns `fail(500)` with error ID when handler throws
- **File**: `src/lib/server/app/actions/wrapAction.test.ts`
- **How**: Mock `ensureOrgContext` to return controlled context objects. Mock the inner handler. Assert return shapes.
- **Done when**: 5+ tests pass covering the permission/billing/success/error paths

#### SR-09: Unit tests for directory mapper
- **What**: Test `src/lib/server/app/mappers/directory.ts`
- **Test cases**:
  1. Maps raw role DB row to role list view model (correct fields, no extra fields)
  2. Maps raw system DB row to system list view model
  3. Maps raw process DB row to process list view model
  4. Handles null/missing optional fields gracefully
  5. Generates correct slugs
- **File**: `src/lib/server/app/mappers/directory.test.ts`
- **Done when**: Each mapper function has at least 2 test cases

#### SR-10: Unit tests for detail-relations mapper
- **What**: Test `src/lib/server/app/mappers/detail-relations.ts`
- **Test cases**:
  1. Correctly groups related entities by type
  2. Handles empty relation sets
  3. Returns correct structure for role/system/process portals
- **File**: `src/lib/server/app/mappers/detail-relations.test.ts`
- **Done when**: Core transform logic covered

#### SR-11: Unit tests for process mapper
- **What**: Test `src/lib/server/app/mappers/processes.ts`
- **Test cases**:
  1. Maps process row + actions to detail view model
  2. Sorts actions by `sort_order`
  3. Handles process with zero actions
  4. Includes trigger and end_state in output
- **File**: `src/lib/server/app/mappers/processes.test.ts`
- **Done when**: 4+ tests pass

#### SR-12: Expand RBAC test coverage
- **What**: Add edge cases to `src/lib/server/team-rbac.test.ts`
- **Test cases to add**:
  1. `editor` cannot manage anyone
  2. `member` cannot manage anyone
  3. `admin` cannot remove `owner`
  4. `admin` can assign `editor` and `member` but not `admin` or `owner`
  5. `owner` can assign any role except `owner`
  6. Cannot change own role (all role levels)
- **Done when**: RBAC edge cases locked down

---

### WS-D: UI Polish Pass (P1)

**Why**: These are the rough edges a prospect would notice in a demo.

**Tickets:**

#### SR-13: Fix flag button/modal pattern
- **What**: From todo.md — flag creation should follow the same button→modal pattern used elsewhere
- **Where**: `src/lib/components/InlineEntityFlagControl.svelte`, `src/lib/components/FlagsCreateForm.svelte`
- **How**:
  1. Read both components
  2. Align the trigger (button) and form (modal) to match the pattern used in `CreateProcessModal.svelte` and `InlineCreateRoleModal.svelte`
  3. Test: create a flag on a role, system, process, and action — all should work
- **Done when**: Flag creation uses consistent button→modal UX

#### SR-14: Fix flags page — remove flag sidebar from flags list
- **What**: From todo.md — the flags index page (`/app/flags`) shouldn't show a flag sidebar (you can't flag a flag)
- **Where**: `src/routes/app/flags/+page.svelte`
- **How**:
  1. Read the page component
  2. Remove or conditionally hide the `FlagSidebar` component on this page
  3. Verify the page still renders correctly
- **Done when**: `/app/flags` has no self-referential flag sidebar

#### SR-15: Add empty-state treatment for flag sidebars
- **What**: From todo.md — when a flag sidebar has no flags, show a light green outline with a thumbs-up icon instead of empty space
- **Where**: `src/lib/components/FlagSidebar.svelte`
- **How**:
  1. Read the component
  2. Add a conditional empty state: when `flags.length === 0`, render a `border-success/20` outline with a centered thumbs-up outline icon and "No issues" or "All clear" text
  3. Use DaisyUI classes for consistency
- **Done when**: Empty flag sidebars look intentional, not broken

#### SR-16: Full screen audit — all ~40 routes
- **What**: Systematically visit every screen listed in `plans/human/todo.md` and verify:
  - Page loads without console errors
  - Layout isn't broken (no overflows, missing content, blank sections)
  - Interactive elements work (buttons, forms, modals, links)
  - Mobile viewport (375px) doesn't break layout
- **How**:
  1. Use the screen checklist from `plans/human/todo.md`
  2. Visit each route manually (or with Playwright `page.goto()` + screenshot)
  3. Log issues as sub-tasks
  4. Fix blocking issues (broken pages, non-functional buttons)
  5. Defer cosmetic-only issues to a post-launch polish pass
- **Done when**: Every route loads without errors, all interactive elements functional

---

### WS-E: Legal & Trust (P0)

**Why**: Enterprise buyers will check for these. Even SMB customers expect them. Without them, you look like a hobby project.

**Tickets:**

#### SR-17: Add Terms of Service page
- **What**: Add a `/terms` route with your ToS content
- **How**:
  1. Draft ToS content (use a generator like Termly.io as a starting point, then customize)
  2. Create `src/routes/(marketing)/terms/+page.svelte` with the content
  3. Add link in footer layout
- **Content must cover**: Service description, acceptable use, data ownership, liability limitations, termination, governing law
- **Done when**: `/terms` renders, linked from footer

#### SR-18: Add Privacy Policy page
- **What**: Add a `/privacy` route with your privacy policy
- **How**:
  1. Draft privacy policy (cover: what data you collect, how you use it, Supabase/Stripe as processors, cookies, user rights, contact info)
  2. Create `src/routes/(marketing)/privacy/+page.svelte`
  3. Add link in footer layout
- **Done when**: `/privacy` renders, linked from footer

---

### WS-F: Production Observability (P1)

**Why**: You need to know when things break before the customer tells you. `console.error` doesn't send you an email.

**Tickets:**

#### SR-19: Add lightweight error reporting
- **What**: Integrate a production error tracker. Recommended: **Sentry** (free tier covers early-stage SaaS) or **LogFlare** (Cloudflare-native).
- **How (Sentry path)**:
  1. `npm install @sentry/sveltekit`
  2. Add Sentry init to `src/hooks.server.ts` and `src/hooks.client.ts`
  3. Configure DSN via environment variable `PUBLIC_SENTRY_DSN`
  4. Add to Cloudflare secrets: `npx wrangler secret put PUBLIC_SENTRY_DSN`
  5. Test: throw a test error, verify it appears in Sentry dashboard
- **How (lightweight alternative — email on error)**:
  1. Extend `logRuntimeError()` in `src/lib/server/runtime-errors.ts` to call `sendAdminEmail()` for server-side errors
  2. Rate-limit to avoid email floods (max 1 per unique error per 5 minutes)
  3. This is simpler but gives you awareness without a third-party service
- **Done when**: Server errors reach you within minutes

#### SR-20: Add uptime monitoring
- **What**: External ping on `https://systemscraft.co` to alert on downtime
- **How**: Use a free service (UptimeRobot, BetterUptime, or Cloudflare Health Checks)
  1. Create a monitor for `https://systemscraft.co` — check every 5 minutes
  2. Create a monitor for `https://systemscraft.co/pricing` (to verify app rendering, not just DNS)
  3. Configure alerts to your email/Slack
- **Done when**: You get alerted if the site goes down

---

### WS-G: Remaining Codebase Cleanup (P2)

**Why**: Not blocking sales, but makes the codebase maintainable for when you hire or hand off dev work. The existing Linear tickets (EPI-43–49) cover this. They're well-specified.

**Tickets**: Use existing Linear backlog (already detailed):

#### SR-21 → EPI-47: Svelte 5 compatibility audit
- Already specified in Linear
- Fixes deprecation warnings that could break on next Svelte update
- Run `npm run check` after and verify 0 warnings

#### SR-22 → EPI-48: Unit test coverage for data layer
- Already specified in Linear
- Overlaps with WS-C above — merge or skip duplicates
- Focus on any mappers/helpers NOT covered by SR-08 through SR-12

#### SR-23 → EPI-49: Final quality gate + baseline comparison
- Already specified in Linear
- Run after all other work
- Compare line counts and test counts against EPI-28 baseline

---

### WS-H: Marketing & Demo Readiness (P2)

**Why**: If you're selling, someone is looking at the marketing site. It needs to hold up.

**Tickets:**

#### SR-24: Pricing page content review
- **What**: Verify pricing page matches live Stripe plans (names, prices, features)
- **Where**: `src/routes/(marketing)/pricing/`
- **How**:
  1. Cross-reference page content with Stripe dashboard (Basic and Growth plans)
  2. Ensure feature lists are accurate and compelling
  3. Ensure CTA buttons work and lead to checkout
- **Done when**: Pricing page accurately reflects what you're selling

#### SR-25: Homepage / landing page content review
- **What**: Make sure the homepage sells the product clearly
- **Where**: `src/routes/(marketing)/+page.svelte`
- **How**:
  1. Read the page
  2. Verify: clear value proposition, what the product does, who it's for, CTA to sign up
  3. Check all links work
  4. Check mobile layout
- **Done when**: A stranger landing on the page understands what SystemsCraft is

#### SR-26: Prepare demo workspace
- **What**: Create a pre-populated workspace with realistic sample data for live demos
- **How**:
  1. Create a dedicated demo org in production
  2. Populate with 5-8 roles, 4-6 systems, 8-12 processes with realistic business content
  3. Add some flags in various states (open, resolved)
  4. Create a demo user with `editor` role (so you can show but not accidentally delete)
  5. Document the demo login credentials in a secure location (1Password, etc.)
- **Done when**: You can log in and walk through a compelling demo in under 5 minutes

---

## Execution Order

This is the recommended sequence. Items at the same level can be parallelized.

```
Phase 1 — Ship what's built (do first, same day)
├── SR-01: Commit + deploy current work
└── SR-02: Apply DB migration to production

Phase 2 — Safety net (before any more changes)
├── SR-03: Set up Playwright
├── SR-04: E2E marketing pages
└── SR-05: E2E authenticated smoke

Phase 3 — Core quality (in parallel)
├── SR-06: E2E CRUD happy path
├── SR-07: E2E billing gate
├── SR-08: Unit tests for wrapAction
├── SR-09: Unit tests for directory mapper
├── SR-10: Unit tests for detail-relations mapper
├── SR-11: Unit tests for process mapper
└── SR-12: Expand RBAC tests

Phase 4 — Sales blockers (in parallel)
├── SR-13: Fix flag button/modal pattern
├── SR-14: Fix flags page sidebar
├── SR-15: Empty-state flag sidebar
├── SR-17: Terms of Service page
└── SR-18: Privacy Policy page

Phase 5 — Observability + polish
├── SR-16: Full screen audit
├── SR-19: Error reporting
└── SR-20: Uptime monitoring

Phase 6 — Cleanup + marketing
├── SR-21: Svelte 5 compat (EPI-47)
├── SR-22: Data layer tests (EPI-48)
├── SR-24: Pricing page review
├── SR-25: Homepage review
└── SR-26: Demo workspace

Phase 7 — Close out
└── SR-23: Final quality gates (EPI-49)
```

## Testing Rails (Regression Prevention)

Every PR must pass these gates before merge:

### Automated (CI — already configured, extend with Playwright)
1. `npm run check` — 0 errors
2. `npm run lint` — 0 errors
3. `npm run build` — succeeds
4. `npm run test_run` — all unit tests pass
5. `npm run test:e2e` — all Playwright tests pass (after SR-03)

### Pre-deploy (manual or scripted)
6. `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed`
7. `SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed`

### Per-release (manual)
8. Screen spot-check: visit `/app/processes`, `/app/roles`, `/app/systems`, `/app/flags`, `/app/team` — confirm no console errors, data loads
9. CRUD spot-check: create one role, one system, one process — confirm they appear in lists and detail pages

## Metrics to Track

| Metric | Baseline (2026-02-14) | Target |
|--------|----------------------|--------|
| Unit tests | 42 across 10 files | 70+ across 15+ files |
| E2E tests | 0 | 15+ covering critical paths |
| svelte-check errors | 0 | 0 (maintain) |
| App route total lines | ~953 lines removed so far | Continue downward trend |
| Time to detect prod error | Unknown (no monitoring) | < 5 minutes |
| Screens with known issues | Unknown | 0 blocking issues |

## Linear Issue Cleanup

The current Linear board has two overlapping epics (EPI-14 and EPI-27) with many duplicate-status issues. Recommended cleanup:

1. **Keep EPI-27** as the active epic (it's newer and has the correct sub-issues)
2. **Archive EPI-14** and all its Duplicate-status children
3. **Create new issues** for SR-03 through SR-26 under a new "Sales Readiness" project
4. **Close EPI-43–46** as duplicates of the already-completed EPI-30/34/36 work (repos/mappers/componentization are done)
5. **Keep EPI-47–49** as they cover remaining cleanup work

## Open Questions for Founder

1. **Error monitoring preference**: Sentry (more features, third-party) vs. email alerts (simpler, no new vendor)?
2. **Legal content**: Do you want to draft ToS/Privacy yourself, use a generator, or hire a lawyer?
3. **Demo workspace**: Do you have a real customer scenario to model the demo data after?
4. **Timeline pressure**: Are there scheduled demos or sales conversations that set a hard deadline for any of this?
