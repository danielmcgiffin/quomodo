# SystemsCraft V1 Checklist

This file is the source of truth for V1 scope. Update it as decisions change.

## Phase 0: Design Foundation
- [x] Portal pattern implemented everywhere (role/action/system mentions are links)
- [x] Triad model in UI: Process → Actions (Role + System)
- [x] Role/Process/System detail views show self + connections
- [x] Flags view shows rot across the atlas
- [x] Parchment + phthalo green tokens applied
- [x] Top nav with Processes/Roles/Systems/Flags + counts
- [ ] Search entry stub (button only) finalized and placed consistently

## Phase 1: Data Foundation
- [ ] Supabase schema with roles, systems, processes, actions, flags
- [ ] RLS policies for org membership
- [ ] CRUD for roles, systems, processes, actions, flags
- [ ] Nav counts from live data
- [ ] Portals wired to live IDs

## Phase 2: Retrieval
- [ ] ⌘K search for roles/systems/processes/actions
- [ ] Search results rendered as portals
- [ ] Action lists filterable by entry point (role/system/process)

## Phase 3: Flags
- [ ] Flag creation from any entity
- [ ] Flags dashboard (global)
- [ ] Resolve/Dismiss flow

## Deployment
- [ ] Cloudflare env vars set (Supabase + Stripe)
- [ ] Production route access verified for `/app/*`

