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
- [ ] CRUD for roles, systems, processes, actions, flags
- [ ] Nav counts from live data
- [ ] Portals wired to live IDs

## Phase 2: Retrieval
- [ ] ⌘K search for roles/systems/processes/actions
- [ ] Search results rendered as portals
- [ ] Action lists filterable by entry point (role/system/process)

## Phase 3: Flags
- [ ] Flag creation from any entity
- [ ] Member alert/comment creation flow (`comment` as `flag_type`)
- [ ] Sub-entity flag targeting (`target_path`) support
- [ ] Flags dashboard (global)
- [ ] Resolve/Dismiss flow

## Deployment
- [ ] Cloudflare env vars set (Supabase + Stripe)
- [ ] Production route access verified for `/app/*`
- [ ] Cloudflare-only runbook present; no active Vercel deployment docs in launch flow

## Route Isolation
- [x] Legacy starter routes are explicitly marked as deferred (`LP-008`) with TODO markers in retained files
- [x] Active SystemsCraft routes vs retained legacy routes are documented in `LAUNCH_PLAN.md`
