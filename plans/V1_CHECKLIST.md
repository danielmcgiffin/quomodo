# SystemsCraft V1 Checklist

This file is the source of truth for V1 scope. Update it as decisions change.
Execution detail (task IDs, acceptance criteria, sequencing) lives in `LAUNCH_PLAN.md`.
Locked decisions: Cloudflare-only hosting, TipTap for rich text, and RBAC roles (`owner/admin/editor/member`).
Marketing reference source: `.reference/qstr-master/qstr-mrktng/*`.

## Phase 0: Design Foundation

- [x] Portal pattern implemented everywhere (role/action/system mentions are links)
- [x] Triad model in UI: Process → Actions (Role + System)
- [x] `Action` terminology and section labels aligned with PRD wording
- [x] Role/Process/System detail views show self + connections
- [x] Flags view shows rot across the atlas
- [x] Parchment + phthalo green tokens applied
- [x] Top nav with Processes/Roles/Systems/Flags + counts
- [ ] Search entry stub (button only) finalized and placed consistently

## Marketing Surface

- [x] Marketing IA aligned to PRD pages (Home, Method, Partners, Contact)
- [x] Black/gold/green marketing theme separate but related to product UI theme
- [x] Legacy `qstr-mrktng` structure/content migrated to new brand tokens
- [x] Hosting target decision reflected in docs/deploy configuration (Cloudflare only)

## Phase 1: Data Foundation

- [x] Supabase schema with roles, systems, processes, actions, flags
- [x] Permission model implemented: owner/admin/editor/member
- [x] RLS policies for org membership
- [x] `/app` routes now load from Supabase (no static atlas dependency)
- [x] Create flows exist in app for roles, systems, processes, actions, and flags
- [x] Dev seed command creates sample org + triad data without manual SQL
- [x] Supabase app typings updated to triad schema (`LP-020`)
- [x] Row-to-view mapper layer centralized for app list/detail loaders (`LP-022`)
- [x] App mapper/action unit tests cover mapping + role-based auth assumptions (`LP-023`)
- [x] Roles support list/create/edit/delete (`LP-030`)
- [x] Systems support list/create/edit/delete with owner-role linkage (`LP-031`)
- [x] Processes support list/create/edit/delete with ordered action editor (`LP-032`)
- [x] Actions support add/update/delete in process context (`LP-033`)
- [ ] CRUD for roles, systems, processes, actions, flags
- [x] Nav counts from live data
- [x] Portals wired to live IDs

## Phase 2: Retrieval

- [x] Search backend endpoint returns roles/systems/processes/actions with type + snippet (`LP-040`)
- [x] Ctrl-? search for roles/systems/processes/actions (`LP-041`)
- [ ] Search results rendered as portals
- [ ] Action lists filterable by entry point (role/system/process)

## Phase 3: Flags

- [x] Flag creation from any entity
- [x] Member alert/comment creation flow (`comment` as `flag_type`)
- [x] Sub-entity flag targeting (`target_path`) support
- [x] Process/action/role/system pages support whole-entity vs field-level flag targeting (`LP-036`)
- [x] Flags dashboard (global)
- [x] Resolve/Dismiss flow
- [x] Right-side flags sidebar on all `/app/*` pages with stable main-content width (`LP-037`)

## Deployment

- [x] Cloudflare env vars set (Supabase + Stripe)
- [ ] Production route access verified for `/app/*`
- [ ] Cloudflare-only runbook present; no active Vercel deployment docs in launch flow

## Route Isolation

- [x] Legacy starter routes are explicitly marked as deferred (`LP-008`) with TODO markers in retained files
- [x] Active SystemsCraft routes vs retained legacy routes are documented in `LAUNCH_PLAN.md`

## Post-V1: Data-Gated Intelligence (Non-Blocking for V1)

- [ ] `LP-070` Real customer data readiness gate + telemetry baseline for search/docs
- [ ] `LP-071` Deterministic search quality improvements using real customer query logs
- [ ] `LP-072` Ad hoc documentation v1 (template-based export, no LLM)
- [ ] `LP-073` NLP search beta (hybrid lexical + semantic) behind feature flag
- [ ] `LP-074` Ad hoc documentation v2 (LLM-assisted with citations + human review)
