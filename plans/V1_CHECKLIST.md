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
- [ ] `LP-075` Workspace lifecycle UX is self-service (create + rename + first-workspace onboarding polish)
- [ ] `LP-076` Multi-workspace support is productized (workspace switcher + stable active workspace context)
- [ ] `LP-077` In-app team management exists (member list + role changes + remove)
- [ ] `LP-078` Stored in-app invite flow exists (invite, accept, revoke, org attachment)
- [ ] `LP-079` Ownership transfer + consultant leave/stay path is implemented
- [ ] `LP-080` Billing model is finalized and implemented for commercial launch

## Post-Launch Backlog (Explicitly Deferred)

- [ ] `LP-070` Real customer data readiness gate + telemetry baseline
- [ ] `LP-071` Additional deterministic search quality improvements
- [ ] `LP-072` Documentation generation v1 (template-based)
- [ ] `LP-073` NLP search beta (hybrid lexical + semantic)
- [ ] `LP-074` Documentation generation v2 (LLM-assisted with citations + review)
