# SystemsCraft Unified V1 Launch + Sales Plan

Last updated: 2026-02-13  
Owner: Danny McGiffin  
Status: Active consolidated plan

## Purpose

This is the single execution plan for V1 scope, launch readiness, and sales readiness.
For now, these are treated as one combined delivery target.

## Scope Rule (Consolidated)

In scope for this plan:

- External signup -> verified onboarding -> workspace usage on `https://systemscraft.co`.
- Consultant-to-customer workspace handoff without scripts/SQL.
- Cofounder self-service setup without founder intervention.
- Billing that supports paid launch via per-workspace ownership and handoff.
- Preserve existing CRUD, portal traversal, flags, and current search behavior without regressions.

Explicitly out of this plan (post-launch only):

- Additional search work beyond current shipped functionality.
- Documentation generation features.
- NLP/LLM intelligence layers.

## Current State Snapshot

Completed and stable:

- Core `/app` product surface and triad CRUD (`LP-030` to `LP-037`).
- Current retrieval/search baseline (`LP-040` to `LP-043`).
- Rich-text safety/editor path (`LP-050` to `LP-053`).
- Launch hardening baseline (`LP-060` to `LP-064`).
- Email, onboarding runbook pass, and scripted multi-user provisioning (`LP-067` to `LP-069`).

Still open and launch-blocking:

- None.

Not yet productized for commercial handoff:

- Multi-workspace switcher and explicit workspace lifecycle UX.
- In-app invites and role management UX (currently script-based ops path).
- Ownership transfer UX implementation (policy guardrails are now defined).
- Workspace-aligned billing implementation and lapsed-access enforcement.

## Commercial Viability Stories (Acceptance Standard)

### Story A: Consultant-to-Customer Handoff

Danny can create a customer workspace, build the atlas, invite the customer, transfer effective control, and optionally remain as admin/editor; customer can continue operations and team invites without Danny as bottleneck.

### Story B: Cofounder Self-Service Setup

John/Joe can independently sign up, create or name a workspace, start atlas authoring, invite collaborators, and operate with isolated data and billing from any other workspace.

## Unified Launch Gate (V1 + Launch + Sales)

Launch is approved only when all conditions are true:

1. A brand-new external user can sign up and reach `/app/processes` on `https://systemscraft.co` without manual intervention.
2. Workspace lifecycle is self-service in-product (create, identify active workspace, switch when multi-org).
3. Team lifecycle is self-service in-product (invite, accept, role update, remove, ownership transfer policy).
4. Billing path is launch-real (live Stripe plans and known subscription-to-access rules).
5. Existing core product behavior does not regress (CRUD, portal traversal, flags, current search).
6. Quality gates pass on launch commit (`check`, `lint`, `build`, deployed smoke).

## Workstreams and Tasks

### WS1: Close Immediate Launch Blockers

- [x] `LP-065` Production domain + auth callback alignment.
  Acceptance:
- Canonical domain routes correctly to production worker.
- `WebsiteBaseUrl` matches canonical domain.
- Supabase callback/redirect allowlist includes canonical callback URLs.
- End-to-end login/signup callback path validated on canonical domain.
  Status:
- Completed 2026-02-13 (verified `systemscraft.co` + `www.systemscraft.co` Cloudflare custom-domain routes in `wrangler.jsonc`, confirmed `WebsiteBaseUrl` is `https://systemscraft.co`, and re-ran canonical-domain validations: `SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed` PASS at `2026-02-13T12:57:28.268Z`; `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed` PASS at `2026-02-13T13:05:42.143Z`).

- [x] `LP-066` Stripe launch catalog + pricing mapping hardening.
  Acceptance:
- Pricing plans use launch copy and real live IDs (no demo/test copy).
- Subscription mapping resolves cleanly from Stripe product -> app plan.
- Billing portal + checkout roundtrips return to canonical domain paths.
  Progress:
- 2026-02-13: Removed demo/test boilerplate pricing copy and FAQ content in `src/routes/(marketing)/pricing/pricing_plans.ts` and `src/routes/(marketing)/pricing/+page.svelte`.
- 2026-02-13: Hardened subscription mapping in `src/routes/(admin)/account/subscription_helpers.server.ts` to match by Stripe product id with Stripe price id fallback.
- 2026-02-13: Updated checkout + billing portal roundtrip URLs to canonical `WebsiteBaseUrl` in `src/routes/(admin)/account/subscribe/[slug]/+page.server.ts` and `src/routes/(admin)/account/(menu)/billing/manage/+page.server.ts`.
- 2026-02-13: Regression validation PASS on canonical domain:
  - `SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed` PASS at `2026-02-13T13:15:33.263Z`
  - `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed` PASS at `2026-02-13T13:15:35.120Z`
- 2026-02-13: Stripe key rotated to live mode and Cloudflare secrets synced (`npm run -s cf:secrets:sync`) using updated `.env.local` values.
- 2026-02-13: Stripe CLI evidence confirms launch catalog in live mode:
  - products: `prod_TyJ2z0btpQXugh` (SysCraft Basic), `prod_TyJ4L2QxWhOsPg` (SysCraft Growth), `livemode=true`
  - monthly prices: `price_1T0MQHLeepTzGf1NbD28pMhu` (Basic), `price_1T0MS3LeepTzGf1NDO7Pl11a` (Growth), `livemode=true`
- 2026-02-13: Canonical subscribe probes for both launch price IDs return Stripe live checkout sessions (`cs_live_*`) with HTTP `303`.
- 2026-02-13: Post-change regression validation PASS on canonical domain:
  - `SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed` PASS at `2026-02-13T13:39:35.568Z`
  - `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed` PASS at `2026-02-13T13:39:36.721Z`
  Status:
- Completed 2026-02-13 (pricing copy + IDs are launch-ready, subscription mapping resolves with product/price matching, and billing checkout/portal paths roundtrip via canonical domain with live Stripe checkout sessions).

### WS2: Workspace Lifecycle and Multi-Workspace Productization

- [ ] `LP-075` Workspace lifecycle UX (create + rename + first-workspace onboarding polish).
  Acceptance:
- New user gets first workspace automatically or via one clear onboarding step.
- Existing user can create additional workspaces from UI.
- Workspace rename is available to `owner/admin` with server-side auth checks.
  Progress:
- 2026-02-13: Slice 1 implementation added `/app/workspace` create + rename flows, app-nav workspace entry points, and request-scoped org-context caching to prevent duplicate first-workspace bootstrap in multi-load requests; first-workspace onboarding validation remains in progress.
- 2026-02-13: One-time owner-workspace dedupe executed via `scripts/dedupe-owner-workspaces.mjs --apply`; removed duplicate org `67a26826-a763-469d-9477-dfc7dc670356` and verified `duplicate_candidates=0` on post-run dry check.

- [x] `LP-076` Multi-workspace membership context + nav switcher.
  Acceptance:
- User can belong to N workspaces and switch active workspace in app nav.
- All `/app` loaders/actions resolve against selected workspace context.
- Active workspace context is explicit and stable across navigation.
  Progress:
- 2026-02-13: Added explicit active-workspace cookie context (`sc_active_workspace`) resolved in `src/lib/server/atlas.ts` and bootstrapped from `src/hooks.server.ts`.
- 2026-02-13: Added nav workspace switcher in `src/routes/app/+layout.svelte` with workspace options loaded from `src/routes/app/+layout.server.ts`.
- 2026-02-13: Added validated `switchWorkspace` action in `src/routes/app/workspace/+page.server.ts` and workspace-page switch controls in `src/routes/app/workspace/+page.svelte`; workspace creation now auto-selects the new workspace.
- 2026-02-13: Validation PASS (`npm run -s check`; `npm run -s test_run`).
  Status:
- Completed 2026-02-13 (active workspace is explicitly selected and persisted, nav switcher is live, and all `/app` loaders/actions resolve through selected context via `ensureOrgContext`).

### WS3: In-App Team Management and Handoff

- [x] `LP-077` Team management page (`/app/team` or `/app/settings`) for member list + role changes + removal.
  Acceptance:
- `owner/admin` can view members and change/remove according to RBAC policy.
- `editor/member` cannot access forbidden management actions.
  Progress:
- 2026-02-13: Added `/app/team` with member list loader and server actions in `src/routes/app/team/+page.server.ts` and UI in `src/routes/app/team/+page.svelte`.
- 2026-02-13: Added explicit team RBAC helper + coverage in `src/lib/server/team-rbac.ts` and `src/lib/server/team-rbac.test.ts` (owner manages non-owner; admin manages editor/member; self role-change/removal blocked).
- 2026-02-13: Added owner/admin-only Team nav entry in `src/routes/app/+layout.svelte`.
- 2026-02-13: Validation PASS (`npm run -s check`; `npm run -s test_run`).
  Status:
- Completed 2026-02-13 (team management is live in-app with server-side RBAC enforcement; owner transfer and leave/stay remain in `LP-079`).

- [x] `LP-078` Stored invite flow (email invite -> accept -> membership attach).
  Acceptance:
- Invites are persisted (auditable), revocable, and role-scoped.
- Invite acceptance supports both existing users and new signups.
- Accepted invite lands user in the intended workspace.
  Progress:
- 2026-02-13: Added persisted invite schema in `supabase/migrations/20260213104500_add_org_invites.sql` (`org_invites` table, audit fields, role constraints, RLS, and active-invite uniqueness by org+email).
- 2026-02-13: Applied `org_invites` migration to production via Supabase SQL editor and verified RLS policies present.
- 2026-02-13: Added invite token/role/email helpers + tests in `src/lib/server/invites.ts` and `src/lib/server/invites.test.ts`.
- 2026-02-13: Extended `/app/team` with invite create/revoke/history and invite email dispatch in `src/routes/app/team/+page.server.ts` and `src/routes/app/team/+page.svelte`.
- 2026-02-13: Added invite acceptance route in `src/routes/(marketing)/invite/[token]/+page.server.ts` and `src/routes/(marketing)/invite/[token]/+page.svelte`; acceptance upserts membership, marks invite accepted, sets active workspace cookie, and redirects to `/app/processes`.
- 2026-02-13: Updated login continuation paths in `src/routes/(marketing)/login/sign_in/+page.svelte`, `src/routes/(marketing)/login/sign_up/+page.svelte`, and `src/routes/(marketing)/auth/callback/+server.js` so invitees can complete sign-in/sign-up and return to invite acceptance.
- 2026-02-13: Validation PASS (`npm run -s check`; `npm run -s test_run`).
  Status:
- Completed 2026-02-13 (stored invite records, revoke flow, and email-link acceptance are live; accepted invites land in invited workspace context).

- [ ] `LP-079` Ownership transfer + consultant leave/stay path.
  Acceptance:
- Only current `owner` can initiate transfer in-product.
- Recipient must be an existing verified `admin` member of the workspace.
- Transfer is atomic with billing owner handoff (both succeed or both roll back).
- Transfer is allowed while workspace billing is lapsed; lapsed state persists after transfer until reactivation.
- Ownership cannot be orphaned: current owner remains owner until recipient acceptance and billing-owner update complete.
- Prior owner can choose post-transfer role: stay `admin`, stay `editor`, or leave workspace.
- Immutable audit record and notifications are emitted to prior/new owners.

### WS4: Billing and Sales Readiness

- [ ] `LP-080` Billing model alignment for commercial launch.
  Acceptance:
- Launch billing model is per-workspace with owner as billing authority.
- Lapsed workspaces are view-only for all roles.
- In lapsed state, invites are blocked; `owner/admin` may still remove members; billing actions are available.
- Reactivation from lapsed is owner-only.
- Ownership transfer remains allowed in lapsed state under `LP-079` transfer guardrails.
- Implement model end-to-end and validate in smoke/runbook.
- Customer handoff billing path is documented for sales operations.

## Execution Sequence (Single Track)

1. `LP-065`, `LP-066` (hard blockers for external paid launch).
2. `LP-075`, `LP-076` (self-service workspace lifecycle and multi-org support).
3. `LP-077`, `LP-078`, `LP-079` (in-app handoff and team autonomy).
4. `LP-080` (billing model completion for sales close + customer ownership).
5. Final launch verification on canonical domain and launch commit.

## Founder Decisions (Locked 2026-02-13)

1. Billing model: per-workspace; workspace `owner` is billing authority.
2. Ownership transfer initiation: current owner only; recipient must be existing verified `admin`.
3. Ownership transfer behavior: atomic with billing-owner handoff; no orphaned owner state.
4. Lapsed policy: view-only for all roles, invites blocked, `owner/admin` can remove members, billing actions remain available.
5. Reactivation policy: owner-only.
6. Consultant post-handoff: prior owner can stay `admin`, stay `editor`, or leave.
7. Invite mechanism: stored invite records (not stateless links only).

## Quality Gates Before Launch Approval

- `npm run check` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `SMOKE_BASE_URL=https://systemscraft.co npm run -s smoke:deployed` passes.
- `SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed` passes.
- No open P0/P1 issues on workspace/team/billing critical path.

## Post-Launch Backlog (Explicitly Deferred)

These are intentionally out of the consolidated V1 launch/sales scope:

- [ ] `LP-070` Customer-data telemetry gate.
- [ ] `LP-071` Additional deterministic search quality layer.
- [ ] `LP-072` Documentation generation v1 (template-based).
- [ ] `LP-073` NLP search beta.
- [ ] `LP-074` Documentation generation v2 (LLM-assisted with citations/review).

## Agent Execution Protocol

1. Read `AGENTS.md`.
2. Read `plans/V1_CHECKLIST.md`.
3. Read this file (`plans/LAUNCH_PLAN.md`).
4. Execute the next unchecked `LP-*` task unless user sets a different priority.
5. Update both `plans/LAUNCH_PLAN.md` and `plans/V1_CHECKLIST.md` when scope/status changes.
6. Include touched `LP-*` IDs in commit/PR summaries.
7. For marketing tasks, review `.reference/qstr-master/qstr-mrktng/*` before creating new content.
