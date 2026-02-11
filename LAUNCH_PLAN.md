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
- Marketing reference source (repo): `https://github.com/danielmcgiffin/qstr/tree/master/qstr-mrktng` (legacy color scheme).
- Marketing reference source (local archive): `.reference/qstr-master/qstr-mrktng/*`.

## Current State Audit
### What is implemented
- Product shell exists under `/app` with tabs for Processes, Roles, Systems, Flags.
- Triad model is live in Supabase-backed routes: Process -> ordered Actions, each action has one Role and one System.
- Entity detail views are connected through portal links and read from DB loaders.
- Create flows exist for Roles, Systems, Processes, Actions, and Flags.
- Visual token system exists with parchment background and green accent (`--sc-green` family).
- Marketing shell now uses SystemsCraft IA (`/`, `/method`, `/method/[slug]`, `/partners`, `/contact`) with dark/gold theme and `/app` entry CTA.
- Cloudflare adapter and Wrangler config are present.
- Sitemap excludes `/app` routes and now includes `paramValues` for `/method/[slug]`.

### What is not implemented
- Full CRUD is incomplete (edit/delete and reorder UX still pending).
- No command/search surface (`Cmd+K` is visual only).
- No production-grade rich-text pipeline (currently rendering raw HTML).
- Supabase generated app typings are not updated to the triad schema yet.

### Technical risks to address before launch
- `RichText.svelte` uses raw `{@html}` and is unsafe for untrusted content.
- Build has recurring Svelte warnings in legacy template account/login pages (`state_referenced_locally`); non-blocking but noisy.
- Hooks currently log missing Supabase env warnings repeatedly in environments without vars configured.
- Product exists in `/app` while starter template dashboard still lives in `/account`, which can confuse users and future agents.

## PRD Alignment Summary
- Triad modeling direction is aligned with PRD intent (Role/Action/System chains).
- Portal-first traversal is partially aligned; current views support linking but not hover previews or search-entry parity.
- Roman Martial visual direction is mostly aligned on product shell and tokens.
- Marketing IA and black/gold theming are now aligned with PRD scope (`Home`, `Method`, `Partners`, `Contact`).
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

## Concrete V1 Architecture (Target)
### Route groups
- `(marketing)` is public, prerender-friendly, and brand-oriented.
- `/app/*` is authenticated application surface (process atlas).
- `(admin)/account/*` is account/billing/auth settings only.

### Route map to keep
- Keep: `/`, `/method`, `/method/[slug]`, `/partners`, `/contact`, `/sitemap.xml`.
- Keep: `/app/processes`, `/app/processes/[slug]`, `/app/roles`, `/app/roles/[slug]`, `/app/systems`, `/app/systems/[slug]`, `/app/flags`.
- Keep: `/account/*` for settings/billing/session.
- Redirect: `/account` -> `/app/processes`.
- Exclude from sitemap: all `/app/*` and account/auth paths.

### Code ownership map
- UI shell and nav: `src/routes/app/+layout.svelte`.
- DB helpers and org context: `src/lib/server/atlas.ts`.
- Rich text renderer (current risk): `src/lib/components/RichText.svelte`.
- Auth and env handling: `src/hooks.server.ts`.
- Search index plugin (current static-index source): `src/lib/build_index.ts`.
- Sitemap config: `src/routes/(marketing)/sitemap.xml/+server.ts`.
- Cloudflare deploy config: `svelte.config.js`, `wrangler.jsonc`.

## Data Contract (V1 Canonical)
### Entities
- `roles`: `name`, `description_rich`, optional metadata.
- `systems`: `name`, `description_rich`, `location`, `owner_role_id`.
- `processes`: `name`, `description_rich`, `trigger`, `end_state`, `owner_role_id`.
- `actions`: ordered list by `sequence` per process, each with `description_rich`, `owner_role_id`, `system_id`.
- `flags`: alert/comment/quality marker on entity or sub-entity path.

### Relational rules
- A process has many actions.
- An action belongs to exactly one process.
- An action references exactly one role and one system.
- A flag references exactly one target entity (`target_type`, `target_id`), with optional `target_path`.

### Sub-entity flag targeting
- Feasible and included in V1.
- Mechanism: `flags.target_path` as string path for field/subfield targeting.
- Examples:
  - `description` (process description)
  - `actions.<action_id>.owner_role_id` (specific action owner link)
  - `actions.<action_id>.description` (specific action description)
  - `systems.<system_id>.location` (system location field)

### Rich text storage
- TipTap JSON is canonical storage format.
- Render via TipTap/ProseMirror renderer plus sanitization policy.
- Do not persist arbitrary HTML as primary source.

## Permission Model (Locked)
Workspace roles and permissions:

- `Owner`: full access, can create Admins, controls all downstream permissions.
- `Admin`: can create Editors and add people to workspace.
- `Editor`: can create new processes and edit existing processes/actions.
- `Member`: read access to all processes, can create alerts/comments.

Implementation requirements:
- Role assignment must be enforced by RLS and server-side authorization checks.
- UI must hide or disable actions users cannot perform.

### RBAC matrix (V1)
| Capability | Owner | Admin | Editor | Member |
|---|---|---|---|---|
| Invite users | Yes | Yes | No | No |
| Assign `admin` role | Yes | No | No | No |
| Assign `editor` role | Yes | Yes | No | No |
| Assign `member` role | Yes | Yes | Yes (optional: No for stricter model) | No |
| Create/Edit/Delete processes | Yes | Yes | Yes | No |
| Create/Edit/Delete actions | Yes | Yes | Yes | No |
| Create/Edit/Delete roles/systems | Yes | Yes | No (unless promoted) | No |
| Create alert/comment flag | Yes | Yes | Yes | Yes |
| Resolve/Dismiss flags | Yes | Yes | Yes | No (create-only) |
| Billing settings | Yes | Yes | No | No |

Policy default for uncertainty:
- Favor stricter access in DB/RLS first.
- Expand in UI only after explicit founder approval.

## Workstreams and Tasks
Use task IDs in commits/PR notes so progress is auditable.

### WS0: Marketing and Positioning Surface
- [x] `LP-000` Decide launch hosting and deployment stance (Cloudflare-only).
Acceptance:
- Single hosting target is documented and reflected in README and deploy scripts.

- [x] `LP-004` Align marketing IA to PRD (`Home`, `Method`, `Partners`, `Contact`).
Acceptance:
- Required pages exist, nav/footer point to them, and outdated template links are removed.
- Structure and copy are ported from the referenced `qstr-mrktng` site where applicable.

- [x] `LP-005` Apply black/gold/green marketing theme independent but linked to product UI theme.
Acceptance:
- Marketing route group uses brand-dark palette and retains legibility/mobile usability.
- Product `/app` keeps parchment/green operational UI.

- [x] `LP-006` Extract and migrate reusable marketing assets/content from `qstr-mrktng`.
Acceptance:
- Hero/value props, core sections, and CTA language are migrated or intentionally replaced.
- Any old color tokens are replaced with current brand tokens.

- [x] `LP-007` Replace starter template nav/footer links with SystemsCraft IA.
Acceptance:
- Remove `GitHub star`, template sponsor block, and template blog/pricing links from primary marketing nav.
- Top-level nav reflects SystemsCraft pages and app entry.

### WS1: Product IA and Route Consolidation
- [x] `LP-001` Choose primary post-login route and enforce redirect.
Acceptance:
- Authenticated users land on `/app/processes`.
- No nav path leads users to placeholder starter dashboard by default.

- [x] `LP-002` Add global app entry links from marketing/account surfaces.
Acceptance:
- User can reach `/app` from known top-level nav after login.

- [x] `LP-003` Clean route semantics and wording consistency.
Acceptance:
- UI uses `Action` terminology everywhere.
- Header, section labels, and empty states align with PRD vocabulary.

- [x] `LP-008` Legacy template isolation plan.
Acceptance:
- Document which starter routes remain for auth/account internals vs which are replaced for SystemsCraft brand/product.
- Add TODO markers in retained legacy files that are intentionally deferred.

LP-008 route isolation inventory:
- SystemsCraft primary product routes (active): `/app/processes`, `/app/processes/[slug]`, `/app/roles`, `/app/roles/[slug]`, `/app/systems`, `/app/systems/[slug]`, `/app/flags`.
- SystemsCraft primary marketing routes (active): `/`, `/method`, `/method/[slug]`, `/partners`, `/contact`.
- Legacy starter routes retained for continuity only (deferred): `/account/*` account/billing shell internals, `/login/*`, `/blog/*`, `/pricing`, `/search`, `/contact_us`.
- Rule for retained legacy routes: maintenance and compatibility fixes only; no new product scope.

### WS2: Supabase Data Model and Migrations
- [x] `LP-010` Create new migration for triad schema in `supabase/migrations/*`.
Acceptance:
- Tables exist for `orgs`, `org_members`, `roles`, `systems`, `processes`, `actions` (rename from `steps`), and `flags`.
- Constraints enforce one role + one system per action.

- [x] `LP-011` Add indexes and helper views for retrieval.
Acceptance:
- Indexes support list/detail/search queries by `org_id`, foreign keys, and flag status.
- Unified search view/materialized view for entities exists.

- [x] `LP-015` Add sub-entity targeting support on flags.
Acceptance:
- `flags.target_path` supports field-level targeting (example: `description`, `owner_role_id`).
- API and UI can create/read flags for both entity-level and sub-entity-level targets.

- [x] `LP-012` Implement RLS policies for all triad tables.
Acceptance:
- Org members can read/write only their org data according to role.
- Non-members cannot access org data.

- [x] `LP-014` Implement role model and authorization rules (`owner`, `admin`, `editor`, `member`).
Acceptance:
- Membership enum and policies support all four roles.
- Permission checks match the locked model in this plan.

- [ ] `LP-013` Seed a development org and sample data script.
Acceptance:
- Fresh local project can be seeded and browsed in `/app` without manual SQL.

- [x] `LP-016` Add DB-level constraints and triggers for action ordering.
Acceptance:
- Unique sequence per process (`UNIQUE(process_id, sequence)`).
- Trigger/function keeps `updated_at` current and preserves ordering behavior on reorder.

### WS3: Data Access Layer and Types
- [ ] `LP-020` Generate/update typed DB interfaces from Supabase schema.
Acceptance:
- App code imports typed table definitions for triad entities.

- [x] `LP-021` Replace static atlas data with repository/service layer.
Acceptance:
- All `/app` loaders read from Supabase.
- No production route depends on hardcoded atlas arrays.

- [ ] `LP-022` Centralize mapping from DB rows to UI view-models.
Acceptance:
- Reusable mapping functions power all list/detail pages.
- No duplicated mapping logic across route loaders.

- [ ] `LP-023` Introduce repository tests for mapping and authorization assumptions.
Acceptance:
- Unit tests cover row-to-view mapping and visibility rules for at least one positive/negative role case.

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

- [x] `LP-034` Implement Flags CRUD from entity pages.
Acceptance:
- Any role/system/process/action can be flagged.
- Flags list can resolve/dismiss with metadata update.

- [x] `LP-035` Implement comment-backed flags with member-create permissions.
Acceptance:
- Member comments create `flags` rows with `flag_type = comment`.
- Owner/Admin/Editor can moderate comment flags according to policy.

- [ ] `LP-036` Implement field-level flag creation UI.
Acceptance:
- From Process/Action/Role/System pages, user can flag either whole entity or specific field target.
- `target_path` is populated when field-level option is used.

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

- [ ] `LP-043` Search relevance tuning and result grouping.
Acceptance:
- Search results group by entity type and prioritize exact name/title matches.
- Result item includes portal context snippet (role/system/process linkage).

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

- [ ] `LP-053` Add migration fallback for existing HTML seed content.
Acceptance:
- Existing static HTML description content is either converted to TipTap JSON or safely rendered through a compatibility adapter.

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

- [ ] `LP-064` Deployment playbook for Cloudflare-only release.
Acceptance:
- Single runbook covers `npm run build`, `npx wrangler deploy`, required vars/secrets, and rollback strategy.
- No Vercel deployment instructions remain in active docs.

## Execution Order With Dependencies
### Stage A: Foundation
1. `LP-004`, `LP-005`, `LP-006`, `LP-007` (marketing and IA clarity).
2. `LP-002`, `LP-003`, `LP-008` (app entry and semantics cleanup).

### Stage B: Data and security
1. `LP-010`, `LP-011`, `LP-012`, `LP-014`, `LP-015`, `LP-016`.
2. `LP-013` seed script after schema stabilizes.

### Stage C: App wiring
1. `LP-020`, `LP-021`, `LP-022`, `LP-023`.
2. `LP-030` to `LP-036` CRUD and flag/comment flows.

### Stage D: Retrieval and quality
1. `LP-040`, `LP-041`, `LP-042`, `LP-043`.
2. `LP-051`, `LP-052`, `LP-053`.
3. `LP-060` to `LP-064`.

## Delivery Cadence (Suggested)
Use this as a planning baseline, not a hard date commitment.

- Week 1:
  - Finalize marketing IA/theme migration (`LP-004` to `LP-007`).
  - Complete route semantics cleanup (`LP-002`, `LP-003`, `LP-008`).
- Week 2:
  - Ship schema + RLS + seed (`LP-010` to `LP-016`, `LP-013`).
- Week 3:
  - Replace static atlas with Supabase-backed loaders (`LP-020` to `LP-023`).
- Week 4:
  - CRUD flows + comment/flag mechanics (`LP-030` to `LP-036`).
- Week 5:
  - Search + retrieval polish + rich text hardening (`LP-040` to `LP-053`).
- Week 6:
  - Hardening, smoke tests, deployment playbook, launch gate (`LP-060` to `LP-064`).

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
- Search index build completes without jsdom stylesheet parse exceptions.
- No 500s on prerendered marketing routes (`/`, `/sitemap.xml`, `/method/*`, `/partners`, `/contact`).

## Smoke Test Script (Minimum)
1. Log in as `Owner`; verify create/edit of process and action chain.
2. Log in as `Admin`; verify can invite user and assign `Editor`.
3. Log in as `Editor`; verify can edit process/actions but cannot change billing.
4. Log in as `Member`; verify read access and comment flag creation only.
5. From process detail, click role portal then system portal; verify one-click traversal.
6. Create field-level flag (`target_path`) and verify it appears in flags dashboard.
7. Use search (`Cmd+K`) to find one process, one role, one system; verify deep-link navigation.
8. Run `npx wrangler deploy` in target environment and confirm app boot + no blocking runtime errors.

## Agent Execution Protocol
Every agent working on launch must follow this order:

1. Read `AGENTS.md`.
2. Read `V1_CHECKLIST.md`.
3. Read this file (`LAUNCH_PLAN.md`).
4. Pick the next unchecked `LP-*` task unless the user overrides priority.
5. Update both `LAUNCH_PLAN.md` (task state) and `V1_CHECKLIST.md` when scope/status changes.
6. Include touched `LP-*` IDs in commit/PR summaries.
7. For marketing tasks, inspect `.reference/qstr-master/qstr-mrktng/*` before designing from scratch.
