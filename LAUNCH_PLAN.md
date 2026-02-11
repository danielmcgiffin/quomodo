# SystemsCraft Launch Plan

Last updated: 2026-02-11
Owner: Danny McGiffin
Status: Active plan for V1 launch

## Purpose
This is the operational plan to get SystemsCraft from current prototype state to a launch-ready V1.
It is detailed enough for founder decision-making and for any agent to execute without guesswork.

## Inputs Reviewed
- PRD (SystemsCraft Product Specification v4, 2026-02-09) from project thread.
- Current code implementation in `src/routes/app/*`, `src/lib/data/atlas.ts`, `src/hooks.server.ts`, and deployment config.
- Existing scope tracker in `V1_CHECKLIST.md`.

## Current State Audit
### What is implemented
- Product shell exists under `/app` with tabs for Processes, Roles, Systems, Flags.
- Triad model is represented with static data: Process -> ordered Actions, each action has one Role and one System.
- Entity detail views are connected through portal links.
- Visual token system exists with parchment background and green accent (`--sc-green` family).
- Cloudflare adapter and Wrangler config are present.
- Sitemap excludes `/app` routes, preventing prerender failures from dynamic app slugs.

### What is not implemented
- `/app` uses static in-memory data, not Supabase.
- No app CRUD for Roles, Systems, Processes, Actions, or Flags.
- No org-level RLS-backed multitenancy in running app paths.
- No command/search surface (`Cmd+K` is visual only).
- Flags actions (`Resolve` and `Dismiss`) are non-functional.
- No production-grade rich-text pipeline (currently rendering raw HTML).
- Existing Supabase migrations are starter-template focused and do not include the SystemsCraft triad schema.

### Technical risks to address before launch
- `RichText.svelte` uses raw `{@html}` and is unsafe for untrusted content.
- Build has recurring Svelte warnings in legacy template account/login pages (`state_referenced_locally`); non-blocking but noisy.
- Hooks currently log missing Supabase env warnings repeatedly in environments without vars configured.
- Product exists in `/app` while starter template dashboard still lives in `/account`, which can confuse users and future agents.

## PRD Alignment Summary
- Triad modeling direction is aligned with PRD intent (Role/Action/System chains).
- Portal-first traversal is partially aligned; current views support linking but not hover previews or search-entry parity.
- Roman Martial visual direction is mostly aligned on product shell and tokens.
- Marketing surface is not yet aligned with PRD marketing scope (`Home`, `Method`, `Partners`, `Contact` in black/gold).
- Hosting direction is now explicitly Cloudflare-only.

## Launch Definition (V1)
V1 is launch-ready when all of the following are true:

1. A signed-in org member can create, edit, and traverse Roles, Systems, Processes, Actions, and Flags using live Supabase data.
2. The retrieval test works on core questions in one interaction:
   - Enter via Role: see their actions, processes, and systems.
   - Enter via System: see all actions, processes, and roles using it.
   - Enter via Process: see ordered action chain with role and system context.
   - Enter via Flags: see open issues, owner, and target portal.
3. `Cmd+K` (or search input) returns entities and deep-links to their detail views.
4. Deploy pipeline is stable on Cloudflare with required env vars and no blocking runtime errors.
5. Basic quality gates pass: build, typecheck, lint, smoke tests for core flows.

## Scope Decisions For V1
- `/app` is the SystemsCraft product surface.
- `/account` remains account-management namespace; `/account` root redirects to `/app/processes`.
- Entity model naming uses `Action` (not `Step`) in UI and data.
- Process model fields for V1: `name`, `description`, `trigger`, `end_state`, `owner`.
- Rich text editor for V1 is TipTap.
- Hosting for V1 is Cloudflare only (no Vercel target).
- Comments are modeled as `flags` with `flag_type = comment`.
- Flags can target whole entities and optional sub-entity paths via `target_path`.
- AI and vector retrieval are out of V1 scope.

## Permission Model (Locked)
Workspace roles and permissions:

- `Owner`: full access, can create Admins, controls all downstream permissions.
- `Admin`: can create Editors and add people to workspace.
- `Editor`: can create new processes and edit existing processes/actions.
- `Member`: read access to all processes, can create alerts/comments.

Implementation requirements:
- Role assignment must be enforced by RLS and server-side authorization checks.
- UI must hide or disable actions users cannot perform.

## Workstreams and Tasks
Use task IDs in commits/PR notes so progress is auditable.

### WS0: Marketing and Positioning Surface
- [x] `LP-000` Decide launch hosting and deployment stance (Cloudflare-only).
Acceptance:
- Single hosting target is documented and reflected in README and deploy scripts.

- [ ] `LP-004` Align marketing IA to PRD (`Home`, `Method`, `Partners`, `Contact`).
Acceptance:
- Required pages exist, nav/footer point to them, and outdated template links are removed.

- [ ] `LP-005` Apply black/gold marketing theme independent from product UI theme.
Acceptance:
- Marketing route group uses brand-dark palette and retains legibility/mobile usability.
- Product `/app` keeps parchment/green operational UI.

### WS1: Product IA and Route Consolidation
- [x] `LP-001` Choose primary post-login route and enforce redirect.
Acceptance:
- Authenticated users land on `/app/processes`.
- No nav path leads users to placeholder starter dashboard by default.

- [ ] `LP-002` Add global app entry links from marketing/account surfaces.
Acceptance:
- User can reach `/app` from known top-level nav after login.

- [ ] `LP-003` Clean route semantics and wording consistency.
Acceptance:
- UI uses `Action` terminology everywhere.
- Header, section labels, and empty states align with PRD vocabulary.

### WS2: Supabase Data Model and Migrations
- [ ] `LP-010` Create new migration for triad schema in `supabase/migrations/*`.
Acceptance:
- Tables exist for `orgs`, `org_members`, `roles`, `systems`, `processes`, `actions` (rename from `steps`), and `flags`.
- Constraints enforce one role + one system per action.

- [ ] `LP-011` Add indexes and helper views for retrieval.
Acceptance:
- Indexes support list/detail/search queries by `org_id`, foreign keys, and flag status.
- Unified search view/materialized view for entities exists.

- [ ] `LP-015` Add sub-entity targeting support on flags.
Acceptance:
- `flags.target_path` supports field-level targeting (example: `description`, `owner_role_id`).
- API and UI can create/read flags for both entity-level and sub-entity-level targets.

- [ ] `LP-012` Implement RLS policies for all triad tables.
Acceptance:
- Org members can read/write only their org data according to role.
- Non-members cannot access org data.

- [ ] `LP-014` Implement role model and authorization rules (`owner`, `admin`, `editor`, `member`).
Acceptance:
- Membership enum and policies support all four roles.
- Permission checks match the locked model in this plan.

- [ ] `LP-013` Seed a development org and sample data script.
Acceptance:
- Fresh local project can be seeded and browsed in `/app` without manual SQL.

### WS3: Data Access Layer and Types
- [ ] `LP-020` Generate/update typed DB interfaces from Supabase schema.
Acceptance:
- App code imports typed table definitions for triad entities.

- [ ] `LP-021` Replace static atlas data with repository/service layer.
Acceptance:
- All `/app` loaders read from Supabase.
- No production route depends on hardcoded atlas arrays.

- [ ] `LP-022` Centralize mapping from DB rows to UI view-models.
Acceptance:
- Reusable mapping functions power all list/detail pages.
- No duplicated mapping logic across route loaders.

### WS4: CRUD and Authoring Flows
- [ ] `LP-030` Implement Roles CRUD (list/create/edit/delete).
Acceptance:
- Role changes immediately appear in connected process/system views.

- [ ] `LP-031` Implement Systems CRUD with owner role linkage.
Acceptance:
- System detail shows owning/admin role and related actions.

- [ ] `LP-032` Implement Processes CRUD with ordered Actions editor.
Acceptance:
- Process edit supports action ordering and single role/system assignment per action.
- Reordering preserves deterministic sequence values.

- [ ] `LP-033` Implement Action CRUD inside Process context.
Acceptance:
- Add/update/delete actions updates role and system traversals correctly.

- [ ] `LP-034` Implement Flags CRUD from entity pages.
Acceptance:
- Any role/system/process/action can be flagged.
- Flags list can resolve/dismiss with metadata update.

- [ ] `LP-035` Implement comment-backed flags with member-create permissions.
Acceptance:
- Member comments create `flags` rows with `flag_type = comment`.
- Owner/Admin/Editor can moderate comment flags according to policy.

### WS5: Retrieval and Search
- [ ] `LP-040` Implement search backend endpoint for entity lookup.
Acceptance:
- Query returns roles/systems/processes/actions with type and snippet.

- [ ] `LP-041` Implement UI search overlay (`Cmd+K` + click result).
Acceptance:
- Keyboard shortcut opens search.
- Selecting result navigates to the correct detail route.

- [ ] `LP-042` Add role/system/process scoped filters for actions.
Acceptance:
- User can answer "what does this role do?" and "what uses this system?" with one interaction.

### WS6: Rich Text Safety and Rendering
- [x] `LP-050` Define canonical rich text storage format for V1.
Acceptance:
- TipTap is the canonical editor and storage pipeline for V1.

- [ ] `LP-051` Implement sanitization before render.
Acceptance:
- No direct unsanitized `{@html}` from user input.
- XSS smoke tests added for malicious payloads.

- [ ] `LP-052` Add minimal rich text authoring UI for descriptions.
Acceptance:
- Role/System/Process/Action descriptions can be formatted and persisted.

### WS7: Launch Hardening and Operations
- [ ] `LP-060` Set required Cloudflare env vars in production and preview.
Acceptance:
- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PRIVATE_SUPABASE_SERVICE_ROLE`, `PRIVATE_STRIPE_API_KEY` are configured.

- [ ] `LP-061` Add smoke test checklist for deployed app.
Acceptance:
- Documented pass/fail for login, CRUD, portals, search, flags, billing route access.

- [ ] `LP-062` Add logging/error baseline.
Acceptance:
- Runtime errors are captured (Cloudflare logs minimum).
- Common failure states return user-safe messages.

- [ ] `LP-063` Resolve or explicitly defer noisy Svelte warnings from legacy routes.
Acceptance:
- Either warnings fixed or documented as accepted technical debt with owners/date.

## Launch Sequence (Recommended)
1. `WS0` + `WS1` + `WS2` first (market-facing clarity, route clarity, schema truth).
2. `WS3` + `WS4` next (live data and CRUD).
3. `WS6` parallel with `WS4` (rich text safety before broad editing).
4. `WS5` after stable CRUD and indexes.
5. `WS7` final hardening before production announcement.

## Quality Gates
Before launch tag:
- `npm run build` succeeds in CI/deploy environment.
- `npm run check` succeeds.
- `npm run lint` succeeds.
- Manual smoke checklist (`LP-061`) passes.
- No open `P0/P1` defects.

## Agent Execution Protocol
Every agent working on launch must follow this order:

1. Read `AGENTS.md`.
2. Read `V1_CHECKLIST.md`.
3. Read this file (`LAUNCH_PLAN.md`).
4. Pick the next unchecked `LP-*` task unless the user overrides priority.
5. Update both `LAUNCH_PLAN.md` (task state) and `V1_CHECKLIST.md` when scope/status changes.
6. Include touched `LP-*` IDs in commit/PR summaries.
