# SystemsCraft App Codebase Cleanup Plan

Last updated: 2026-02-12
Owner: Danny McGiffin
Status: Draft for execution

## Purpose

This plan defines how to clean and harden the `/app` product surface with a strict scope of:

- `src/routes/app/*`
- `src/lib/components/*` used by `src/routes/app/*`
- `src/lib/server/atlas.ts` and app-only server helpers to be extracted from it
- app-related styling in `src/app.css`

The goals are to:

1. Reduce duplication and file complexity.
2. Componentize UI patterns that are repeated or too large.
3. Cut obsolete/dead code.
4. Make the app pass typecheck/lint/build consistently.
5. Prepare clean foundations for remaining V1 launch tasks.

## Scope And Constraints

## In scope

- Refactors and deletions in `src/routes/app/*`.
- Shared component cleanup for app-facing components.
- Server action and mapper extraction for app routes.
- App-only test additions.

## Out of scope

- Marketing routes and copy.
- New product features beyond planned V1 tasks.
- Broad redesign of visual language.

## SaaS Boilerplate Compatibility

This plan is intentionally compatible with the underlying SaaS starter template.

- Preserve template account/auth/billing surfaces in `src/routes/(admin)/account/*`.
- Preserve core starter integrations (Supabase auth/session wiring, route groups, build/deploy scaffolding).
- Limit cleanup refactors to `/app` and app-shared modules unless a shared typing fix is required for app compilation.
- Avoid changing starter-template feature behavior unless explicitly requested.

## Source-Of-Truth Alignment

- `plans/archive/V1_CHECKLIST.md`: active V1 scope and status.
- `plans/archive/LAUNCH_PLAN.md`: task sequencing and acceptance criteria.

This cleanup plan directly supports:

- `LP-020` typed DB interfaces.
- `LP-022` centralized row-to-view mappings.
- `LP-023` repository and authorization tests.
- `LP-030` to `LP-033` CRUD completion readiness.
- `LP-037` right-rail flags pattern rollout readiness.

## Current State Snapshot (App)

## File-size hotspots

- `src/routes/app/processes/[slug]/+page.svelte` (~492 lines)
- `src/routes/app/processes/[slug]/+page.server.ts` (~469 lines)
- `src/routes/app/processes/+page.server.ts` (~386 lines)
- `src/routes/app/flags/+page.server.ts` (~270 lines)

## Structural issues

- Repeated server action logic (`createRole`, `createSystem`, `createFlag`) across route files.
- Repeated mapping/query patterns across list/detail loaders.
- Inline styles repeated across multiple page components.
- Component-level typing drift in app pages causing casts and inference errors.
- One clearly stale/dead path:
  - `src/lib/components/ProcessDetailSidebar.svelte` is imported in `src/routes/app/processes/[slug]/+page.svelte` but not rendered.

## Quality gate failures currently impacting app work

- `npm run check` reports major app-impacting errors, including:
  - Outdated DB typings for triad tables.
  - App page typing/cast issues.
  - Svelte 5 component API issues in shared components.

## Cleanup Principles

1. Stabilize types before broad refactors.
2. Extract logic before adding new behavior.
3. Keep route files thin: load orchestration + page-specific assembly only.
4. Keep component contracts typed and explicit.
5. Prefer deletion over preservation when code is unused or redundant.

## Target Architecture For App Code

## Route responsibilities

- `+page.server.ts`: loader orchestration and action wiring only.
- `+page.svelte`: layout composition and local UI state only.

## Shared server layer (new)

- `src/lib/server/app/repositories/*`: data fetch/write operations.
- `src/lib/server/app/mappers/*`: DB row -> view-model mappings.
- `src/lib/server/app/actions/*`: reusable action handlers and validation.

## Shared UI layer (expanded)

- Reusable page sections and modal flows extracted from oversized pages.
- Shared portal/list card components used consistently across Processes/Roles/Systems.

## Phased Execution Plan

## Phase 0: Baseline and Branch Discipline

### Tasks

- Capture baseline failures from:
  - `npm run check`
  - `npm run lint`
  - `npm run build`
- Track app-specific failure delta during each phase.

### Acceptance

- Baseline report committed in PR description or task notes.
- No phase merges that increase app-specific failure count.

## Phase 1: Type Foundation and DB Contract (`LP-020`)

### Tasks

- Regenerate and update `src/DatabaseDefinitions.ts` to include triad tables:
  - `orgs`, `org_members`, `roles`, `systems`, `processes`, `actions`, `flags`
- Fix app typing breakages in:
  - `src/lib/server/atlas.ts`
  - `src/routes/app/*.server.ts`
- Normalize loader return types for app pages to remove broad `as` casts.

### Acceptance

- App server files compile against generated DB types.
- No `from("...")` table name type errors in app routes.

## Phase 2: Dead Code and Obsolete Logic Cut

### Tasks

- Remove unused import and stale logic path:
  - `ProcessDetailSidebar` import from `src/routes/app/processes/[slug]/+page.svelte`
- Remove mention-related derivations if not rendered:
  - `mentionHandles`, `relatedRoles`, `relatedHandlesWithoutRole` in process detail page.
- Remove stale/unused payload fields returned from loaders where not consumed.

### Acceptance

- No unused imports/variables in app routes.
- Deleted logic does not alter visible behavior.

## Phase 3: Server Action Consolidation

### Tasks

- Extract reusable handlers:
  - `createRole`
  - `createSystem`
  - `createFlag`
- Replace duplicated route-local implementations in:
  - `src/routes/app/processes/+page.server.ts`
  - `src/routes/app/processes/[slug]/+page.server.ts`
  - `src/routes/app/roles/+page.server.ts`
  - `src/routes/app/systems/+page.server.ts`
  - `src/routes/app/flags/+page.server.ts` (for flag create behavior alignment)
- Centralize validation and consistent fail payload contracts.

### Acceptance

- One implementation per shared action path.
- Route files shrink and remain behaviorally equivalent.

## Phase 4: Query and Mapper Consolidation (`LP-022`)

### Tasks

- Introduce app repository modules for repeated table queries.
- Introduce mapper modules for:
  - role portal models
  - system portal models
  - process cards/detail
  - action display models
  - flag sidebar/dashboard items
- Replace duplicate map/filter/set logic in app loaders with shared mapper calls.

### Acceptance

- Repeated mapping logic removed from route files.
- Mappers are reusable across list and detail pages.

## Phase 5: UI Componentization

### Primary componentization targets

- `src/routes/app/processes/[slug]/+page.svelte`
  - extract `ProcessFactsCard`
  - extract `ProcessActionsList` / `ProcessActionCard`
  - extract `ActionEditorModal`
  - extract `ProcessTraverseCard`
- `src/routes/app/processes/+page.svelte`
  - extract `ProcessListCard`
  - extract reusable page-header action strip for app index pages
- `src/routes/app/roles/+page.svelte` and `src/routes/app/systems/+page.svelte`
  - align common list-card structure with reusable components where practical

### Secondary UI cleanup

- Replace repeated inline styles with CSS classes in `src/app.css`.
- Ensure flags sidebar pattern remains layout-stable where enabled.

### Acceptance

- No app page component larger than ~300 lines unless justified.
- Repeated UI fragments moved into shared components.

## Phase 6: Svelte 5 Compatibility and App UX Hardening

### Tasks

- Update Svelte 5 component patterns in shared app components:
  - `src/lib/components/FlagSidebar.svelte`
  - `src/lib/components/ScModal.svelte`
- Remove unsafe type assertions in app page templates by using typed view-models.
- Keep current UX behavior and wording unless explicitly changed.

### Acceptance

- No Svelte 5 API/deprecation issues in app-facing shared components.
- App pages avoid brittle `as { ... }` casts in markup.

## Phase 7: Test Coverage for App Data Layer (`LP-023`)

### Tasks

- Add mapper unit tests for process/role/system/flag transformations.
- Add action validation tests for permission and target constraints.
- Add at least one role-based positive/negative authorization case.

### Acceptance

- New tests exist and pass in CI/local for extracted app server logic.
- Critical mapper assumptions are under test.

## Phase 8: Final Quality Gates and Launch Readiness Linkage

### Tasks

- Run and pass:
  - `npm run check`
  - `npm run lint`
  - `npm run build`
- Validate no behavioral regressions in core app flows:
  - create role/system/process/action
  - create/resolve/dismiss flags
  - portal traversal

### Acceptance

- App cleanup complete with no added regressions.
- Remaining V1 work (`LP-030` to `LP-037`, `LP-040` to `LP-043`) can proceed on cleaner foundation.

## Explicit Componentization Backlog

- `src/routes/app/processes/[slug]/+page.svelte`: split into 4-5 child components.
- `src/routes/app/processes/+page.svelte`: split card and header action strip.
- `src/routes/app/roles/[slug]/+page.svelte`: optional split for action-group cards.
- `src/routes/app/systems/[slug]/+page.svelte`: optional split for process-usage cards.

## Explicit Deletion/Cut Backlog

- Remove `ProcessDetailSidebar` stale usage path.
- Delete mention-derivation logic in process detail if sidebar is not used.
- Remove any loader data fields not consumed by page templates.
- Remove duplicated action implementations after extraction.

## Execution Order (Recommended)

1. Phase 1 (types) before all other phases.
2. Phase 2 (dead code cut) immediately after types stabilize.
3. Phase 3 and Phase 4 (server consolidation) next.
4. Phase 5 and Phase 6 (componentization and Svelte cleanup) after server layer is stable.
5. Phase 7 and Phase 8 to close.

## Risk Management

- Risk: refactor introduces silent behavior regressions.
  - Mitigation: lock behavior with incremental tests and manual smoke checks.
- Risk: broad changes create long-lived branch drift.
  - Mitigation: execute as small PR-sized slices by phase.
- Risk: mixed style/system changes make diffs noisy.
  - Mitigation: separate functional refactors from CSS-only cleanup commits.

## Deliverables

- New shared app server modules (`repositories`, `mappers`, `actions`).
- Reduced route file complexity and duplication.
- Deleted obsolete/stale code paths.
- Passing app quality gates.
- Cleaner foundation for remaining V1 launch tasks.
