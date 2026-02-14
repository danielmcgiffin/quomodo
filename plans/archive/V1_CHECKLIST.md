# SystemsCraft Unified V1 Launch + Sales Checklist

This checklist tracks the consolidated scope where V1, launch, and sales readiness are one combined target.
Execution details, sequencing, and acceptance criteria live in `plans/LAUNCH_PLAN.md`.
Locked decisions remain: Cloudflare-only hosting, TipTap for rich text, and RBAC roles (`owner/admin/editor/member`).

## Core Product Baseline (Shipped)

- [x] Triad data model and CRUD are live for roles/systems/processes/actions/flags
- [x] RBAC + RLS enforcement for `owner/admin/editor/member`
- [x] Portal traversal across process/role/system/flags is live
- [x] Current search baseline (`Ctrl-?`, grouped results, deep links) is live (`LP-040` to `LP-043`)
- [x] Rich text safety/editor path is live (`LP-050` to `LP-053`)
- [x] Launch hardening baseline completed (`LP-060` to `LP-064`)
- [x] Email/onboarding/provisioning baseline completed (`LP-067` to `LP-069`)

## Unified V1 + Launch + Sales Critical Path

- [x] `LP-065` Production domain, canonical `WebsiteBaseUrl`, and Supabase auth callback allowlist are aligned (canonical-domain validation rerun PASS at `2026-02-13T12:57:28.268Z` for onboarding and `2026-02-13T13:05:42.143Z` for deployed smoke)
- [x] `LP-066` Stripe catalog + pricing config moved from demo/test setup to launch-ready plans (live Stripe key + Cloudflare secret sync complete; canonical subscribe probes return `cs_live_*`; canonical onboarding PASS at `2026-02-13T13:39:35.568Z` and deployed smoke PASS at `2026-02-13T13:39:36.721Z`)
- [x] `LP-075` Workspace lifecycle UX is self-service (create + rename + first-workspace onboarding polish shipped 2026-02-13: `/app/workspace` create + rename + nav entry points + duplicate-bootstrap guard; first-workspace bootstrap now persists `sc_active_workspace` cookie via `src/hooks.server.ts`)
- [x] `LP-076` Multi-workspace support is productized (workspace switcher + stable active workspace context shipped 2026-02-13 with cookie-backed active workspace selection + nav switcher; validation PASS: `npm run -s check`, `npm run -s test_run`)
- [x] `LP-077` In-app team management exists (member list + role changes + remove shipped 2026-02-13 at `/app/team`; owner/admin access only with RBAC-scoped role update/remove actions; self role-change/removal remains deferred; validation PASS: `npm run -s check`, `npm run -s test_run`)
- [x] `LP-078` Stored in-app invite flow exists (invite, accept, revoke, org attachment shipped 2026-02-13 with persisted `org_invites`, `/app/team` invite create/revoke/history, and `/invite/[token]` acceptance for existing/new users with workspace-context landing; prod migration applied 2026-02-13 via Supabase SQL editor and verified RLS policies present; validation PASS: `npm run -s check`, `npm run -s test_run`)
- [x] `LP-079` Ownership transfer + consultant leave/stay path is implemented (shipped 2026-02-13: owner-only initiation in `/app/team`, recipient acceptance via `/transfer/[token]`, recipient must be accepted admin with verified email; prior owner stay admin/editor or leave; audit table `org_ownership_transfers` + RPC functions enforce atomic role/owner updates)
- [x] `LP-080` Billing model is finalized and implemented for commercial launch (shipped 2026-02-13: per-workspace Stripe customer via `org_billing`; lapsed=view-only/no invites enforced server-side; owner-only reactivation via `/account/billing`; in-app lapsed banner shipped; validation PASS: `npm run -s check`, `npm run -s test_run`)

## Post-Launch Backlog (Explicitly Deferred)

- [ ] `LP-070` Real customer data readiness gate + telemetry baseline
- [ ] `LP-071` Additional deterministic search quality improvements
- [ ] `LP-072` Documentation generation v1 (template-based)
- [ ] `LP-073` NLP search beta (hybrid lexical + semantic)
- [ ] `LP-074` Documentation generation v2 (LLM-assisted with citations + review)

## Sales Readiness (In Progress)

- [x] `SR-03` Playwright infrastructure (config + CI hook) (completed 2026-02-14)
- [x] `SR-04` E2E marketing-page smoke coverage (completed 2026-02-14)
- [x] `SR-05` E2E authenticated app smoke (completed 2026-02-14; temporarily using prod Supabase via GitHub Actions secrets)
- [x] `SR-05A` Dedicated E2E Supabase project + seeded fixtures (completed 2026-02-14)
- [x] `SR-06` E2E CRUD happy path (create role/system/process) (completed 2026-02-14)
- [x] `SR-07` E2E billing gate enforcement (completed 2026-02-14)
- [x] `SR-08` Unit tests for `wrapAction` (completed 2026-02-14)
- [x] `SR-09` Unit tests for directory mapper (completed 2026-02-14)
- [x] `SR-10` Unit tests for detail-relations mapper (completed 2026-02-14)
- [x] `SR-11` Unit tests for process mapper (completed 2026-02-14)
- [x] `SR-12` RBAC edge-case test coverage (completed 2026-02-14)
- [x] `SR-13` Flag create button/modal UX (completed 2026-02-14)
- [x] `SR-14` Flags page: remove flag sidebar (completed 2026-02-14)
- [x] `SR-15` Flag sidebar empty state (completed 2026-02-14)
- [ ] `SR-27` Flags dashboard centered + filterable grid (pending)
