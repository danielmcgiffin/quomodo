# SystemsCraft Launch Plan

Last updated: 2026-02-13
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
- Schema contract cleanup is applied in app + migrations:
  - `systems` uses a single locator field (`location`); legacy `url` is removed.
  - `processes.trigger` and `processes.end_state` are required (non-empty).
  - `roles.person_name` and `roles.hours_per_week` are removed.
- Visual token system exists with parchment background and green accent (`--sc-green` family).
- Marketing shell now uses SystemsCraft IA (`/`, `/method`, `/method/[slug]`, `/partners`, `/contact`) with dark/gold theme and `/app` entry CTA.
- Cloudflare adapter and Wrangler config are present.
- Sitemap excludes `/app` routes and now includes `paramValues` for `/method/[slug]`.

### What is not implemented

- Customer onboarding readiness tasks (`LP-065` through `LP-069`) remain open for launch.
- Data-gated `WS8` work (`LP-070` through `LP-074`) remains intentionally out of V1 scope.

### Technical risks to address before launch

- Re-run deployed smoke checks on the exact launch commit to reconfirm `/app/*` route access and traversal in production.
- `scripts/cloudflare-sync-secrets.sh` currently syncs only Supabase + Stripe secrets; email secrets remain a manual step.
- Multi-user workspace provisioning (adding non-owner users into an existing org) is not yet exposed as a dedicated in-app flow.
- Lint baseline still flags `RichText.svelte` for `svelte/no-at-html-tags`; keep sanitizer guarantees and lint policy aligned before release.
- Retrieval still relies on lexical matching; monitor zero-result behavior until WS8 telemetry gates are active.

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
3. `Ctrl-?` (or search input) returns entities and deep-links to their detail views.
4. Deploy pipeline is stable on Cloudflare with required env vars and no blocking runtime errors.
5. Basic quality gates pass: build, typecheck, lint, smoke tests for core flows.
6. A new external user can complete signup on the production domain, verify email, create profile, and reach `/app/processes`, with billing and support email paths functioning.

## Scope Decisions For V1

- `/app` is the SystemsCraft product surface.
- `/account` remains account-management namespace; `/account` root redirects to `/app/processes`.
- Entity model naming uses `Action` (not `Step`) in UI and data.
- Process model fields for V1: `name`, `description`, required `trigger`, required `end_state`, `owner`.
- Rich text editor for V1 is TipTap.
- Hosting for V1 is Cloudflare only (no Vercel target).
- Comments are modeled as `flags` with `flag_type = comment`.
- Flags can target whole entities and optional sub-entity paths via `target_path`.
- AI and vector retrieval are out of V1 scope.
- NLP search and ad hoc documentation generation are post-V1 work, gated on real customer data (`WS8`, `LP-070` to `LP-074`).

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
- `systems`: `name`, `description_rich`, `location` (single locator field), `owner_role_id`.
- `processes`: `name`, `description_rich`, required `trigger`, required `end_state`, `owner_role_id`.
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

| Capability                       | Owner | Admin | Editor                                | Member           |
| -------------------------------- | ----- | ----- | ------------------------------------- | ---------------- |
| Invite users                     | Yes   | Yes   | No                                    | No               |
| Assign `admin` role              | Yes   | No    | No                                    | No               |
| Assign `editor` role             | Yes   | Yes   | No                                    | No               |
| Assign `member` role             | Yes   | Yes   | Yes (optional: No for stricter model) | No               |
| Create/Edit/Delete processes     | Yes   | Yes   | Yes                                   | No               |
| Create/Edit/Delete actions       | Yes   | Yes   | Yes                                   | No               |
| Create/Edit/Delete roles/systems | Yes   | Yes   | No (unless promoted)                  | No               |
| Create alert/comment flag        | Yes   | Yes   | Yes                                   | Yes              |
| Resolve/Dismiss flags            | Yes   | Yes   | Yes                                   | No (create-only) |
| Billing settings                 | Yes   | Yes   | No                                    | No               |

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

- [x] `LP-013` Seed a development org and sample data script.
      Acceptance:
- Fresh local project can be seeded and browsed in `/app` without manual SQL.

- [x] `LP-016` Add DB-level constraints and triggers for action ordering.
      Acceptance:
- Unique sequence per process (`UNIQUE(process_id, sequence)`).
- Trigger/function keeps `updated_at` current and preserves ordering behavior on reorder.

### WS3: Data Access Layer and Types

- [x] `LP-020` Generate/update typed DB interfaces from Supabase schema.
      Acceptance:
- App code imports typed table definitions for triad entities.

- [x] `LP-021` Replace static atlas data with repository/service layer.
      Acceptance:
- All `/app` loaders read from Supabase.
- No production route depends on hardcoded atlas arrays.

- [x] `LP-022` Centralize mapping from DB rows to UI view-models.
      Acceptance:
- Reusable mapping functions power all list/detail pages.
- No duplicated mapping logic across route loaders.

- [x] `LP-023` Introduce repository tests for mapping and authorization assumptions.
      Acceptance:
- Unit tests cover row-to-view mapping and visibility rules for at least one positive/negative role case.

### WS4: CRUD and Authoring Flows

- [x] `LP-030` Implement Roles CRUD (list/create/edit/delete).
      Acceptance:
- Role changes immediately appear in connected process/system views.
  Status:
- Completed 2026-02-12 (role detail edit/delete + linked view propagation via live role loaders).

- [x] `LP-031` Implement Systems CRUD with owner role linkage.
      Acceptance:
- System detail shows owning/admin role and related actions.
  Status:
- Completed 2026-02-12 (system detail edit/delete + owner role linkage persisted and rendered).

- [x] `LP-032` Implement Processes CRUD with ordered Actions editor.
      Acceptance:
- Process edit supports action ordering and single role/system assignment per action.
- Reordering preserves deterministic sequence values.
  Status:
- Completed 2026-02-12 (process detail edit/delete added; ordered action editor includes deterministic up/down resequencing).

- [x] `LP-033` Implement Action CRUD inside Process context.
      Acceptance:
- Add/update/delete actions updates role and system traversals correctly.
  Status:
- Completed 2026-02-12 (process-context delete action flow added; role/system traversals remain loader-derived from actions).

- [x] `LP-034` Implement Flags CRUD from entity pages.
      Acceptance:
- Any role/system/process/action can be flagged.
- Flags list can resolve/dismiss with metadata update.

- [x] `LP-035` Implement comment-backed flags with member-create permissions.
      Acceptance:
- Member comments create `flags` rows with `flag_type = comment`.
- Owner/Admin/Editor can moderate comment flags according to policy.

- [x] `LP-036` Implement field-level flag creation UI.
      Acceptance:
- From Process/Action/Role/System pages, user can flag either whole entity or specific field target.
- `target_path` is populated when field-level option is used.
  Status:
- Completed 2026-02-12 (whole-entity vs field target selection added across process/action/role/system pages, including role/system detail; create-flag failures now preserve `createFlagTargetPath` for modal recovery).

- [x] `LP-037` Add right-rail open flags sidebar on `/app/*` pages.
      Acceptance:
- Each `/app` page renders an open-flags sidebar on the right in desktop layouts.
- When no open flags exist, the sidebar remains in-position so main content width does not shift.
- On pages with multiple sidebar sections, flags appears as the top section.
- `/app/processes` is implemented first as the reference pattern.
  Status:
- Completed 2026-02-12 (roles, systems, and flags pages now use the desktop right-rail pattern with flags as the first sidebar section; empty sidebars keep stable layout width).

### WS5: Retrieval and Search

- [x] `LP-040` Implement search backend endpoint for entity lookup.
      Acceptance:
- Query returns roles/systems/processes/actions with type and snippet.
  Status:
- Completed 2026-02-12 (`/app/search` GET endpoint now returns typed role/system/process/action matches with snippets and route hrefs, including action-to-process deep-link mapping).

- [x] `LP-041` Implement UI search overlay (`Ctrl-?` + click result).
      Acceptance:
- Keyboard shortcut opens search.
- Selecting result navigates to the correct detail route.
  Status:
- Completed 2026-02-12 (`Ctrl-?` app-level overlay wired in `/app` layout; result click deep-links to role/system/process detail and action process routes).

- [x] `LP-042` Add role/system/process scoped filters for actions.
      Acceptance:
- User can answer "what does this role do?" and "what uses this system?" with one interaction.
  Status:
- Completed 2026-02-12 (action lists now expose scoped filters directly in role/system/process entry views, with live counts and filtered traversal cards).

- [x] `LP-043` Search relevance tuning and result grouping.
      Acceptance:
- Search results group by entity type and prioritize exact name/title matches.
- Result item includes portal context snippet (role/system/process linkage).
  Status:
- Completed 2026-02-12 (search overlay now groups results by entity type, ranks exact/prefix/token title matches ahead of weaker matches, and renders portal-linked context for process/role/system/action relationships).

### WS6: Rich Text Safety and Rendering

- [x] `LP-050` Define canonical rich text storage format for V1.
      Acceptance:
- TipTap is the canonical editor and storage pipeline for V1.

- [x] `LP-051` Implement sanitization before render.
      Acceptance:
- No direct unsanitized `{@html}` from user input.
- XSS smoke tests added for malicious payloads.
  Status:
- Completed 2026-02-12 (server rich-text pipeline now renders TipTap JSON via `generateHTML` and sanitizes output with `sanitize-html` before `RichText` render; XSS-focused tests added in `src/lib/server/rich-text.test.ts`).

- [x] `LP-052` Add minimal rich text authoring UI for descriptions.
      Acceptance:
- Role/System/Process/Action descriptions can be formatted and persisted.
  Status:
- Completed 2026-02-12 (shared `RichTextEditor` toolbar wired into role/system/process/action create/edit flows, persisting canonical `description_rich` TipTap JSON while retaining plain-text form fallback).

- [x] `LP-053` Add migration fallback for existing HTML seed content.
      Acceptance:
- Existing static HTML description content is either converted to TipTap JSON or safely rendered through a compatibility adapter.
  Status:
- Completed 2026-02-12 (`normalizeRichTextDocument` now accepts legacy HTML/string payloads, converts through TipTap JSON compatibility parsing when possible, and safely falls back to sanitized text conversion).

### WS7: Launch Hardening and Operations

- [x] `LP-060` Set required Cloudflare env vars in production and preview.
      Acceptance:
- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PRIVATE_SUPABASE_SERVICE_ROLE`, `PRIVATE_STRIPE_API_KEY` are configured.
  Status:
- Completed 2026-02-12 (`npm run cf:secrets:sync` applied secrets to production + preview and `wrangler secret list` verified all four required keys in both environments).

- [x] `LP-061` Add smoke test checklist for deployed app.
      Acceptance:
- Documented pass/fail for login, CRUD, portals, search, flags, billing route access.
  Status:
- Completed 2026-02-12 (run via `npm run smoke:deployed` against `https://quomodo.danielmcgiffin.workers.dev`).
- Result 2026-02-12T19:52:04Z:

  - PASS: Login (owner/admin/editor/member).
  - PASS: CRUD (roles/systems/processes/actions).
  - PASS: Portals traversal.
  - PASS: Search endpoint + deep links.
  - PASS: Flags create + dashboard visibility.
  - PASS: Billing route access (`303` to `/account/create_profile`).

- [x] `LP-062` Add logging/error baseline.
      Acceptance:
- Runtime errors are captured (Cloudflare logs minimum).
- Common failure states return user-safe messages.
  Status:
- Completed 2026-02-12 (global `handleError` with per-request reference id + structured server logs, and `/app` loaders/search/workspace helpers now log internals while returning user-safe 500 messages).

- [x] `LP-063` Resolve or explicitly defer noisy Svelte warnings from legacy routes.
      Acceptance:
- Either warnings fixed or documented as accepted technical debt with owners/date.
  Status:
- Completed 2026-02-12 (`npm run build` completes with no noisy legacy-route Svelte warnings; previously observed `listen EPERM 127.0.0.1` was a restricted local sandbox networking artifact and not route warning debt).

- [x] `LP-064` Deployment playbook for Cloudflare-only release.
      Acceptance:
- Single runbook covers `npm run build`, `npx wrangler deploy`, required vars/secrets, and rollback strategy.
- No Vercel deployment instructions remain in active docs.
  Status:
- Completed 2026-02-12 (`plans/CLOUDFLARE_DEPLOY_RUNBOOK.md` is now the canonical Cloudflare release runbook; `README.md` deploy docs were reduced to Cloudflare-only instructions that point to the runbook).

- [ ] `LP-065` Production domain + auth callback alignment.
      Acceptance:
- Cloudflare custom domain routes to the production worker.
- `WebsiteBaseUrl` in `src/config.ts` matches the canonical production domain.
- Supabase Auth callback + redirect allowlist include `<domain>/auth/callback` and `<domain>/auth/callback?*` (plus local dev callback entries).

- [ ] `LP-066` Stripe launch catalog and pricing mapping hardening.
      Acceptance:
- `src/routes/(marketing)/pricing/pricing_plans.ts` no longer uses demo placeholder copy/IDs for launch plans.
- Each paid plan has valid `stripe_price_id` + `stripe_product_id`, and `subscription_helpers.server.ts` resolves active subscriptions to app plans without mapping errors.
- Stripe Billing Portal config is launch-safe (email editing disabled, plan-change path verified).
- Checkout and billing portal roundtrips return to canonical domain paths.

- [x] `LP-067` Production email deliverability and template branding.
      Acceptance:
- Supabase Auth SMTP is configured for production-domain auth emails.
- Resend is configured with verified sending domain and production sender identity.
- `PRIVATE_RESEND_API_KEY`, `PRIVATE_ADMIN_EMAIL`, and `PRIVATE_FROM_ADMIN_EMAIL` are present in production + preview Cloudflare secrets.
- Welcome/admin email content and sender values are branded (no `saasstarter` defaults).
  Progress:
- 2026-02-12: Code-side branding defaults removed (`no-reply@saasstarter.work`, `SaaS Starter`), welcome templates rebranded, and `scripts/cloudflare-sync-secrets.sh` updated/executed to sync email secrets to both production and preview.
  Status:
- Completed 2026-02-12 (Supabase custom SMTP configured for production-domain auth mail, Resend sender/domain verified, and dashboard-side LP-067 closeout confirmed).

- [x] `LP-068` First-customer onboarding runbook + validation pass.
      Acceptance:
- A single runbook documents the end-to-end external user path: sign up, verify email, create profile, land in `/app/processes`, create first role/system/process/action, run search, file a flag.
- The runbook is executed once against production (or production-equivalent preview) with timestamped pass/fail notes.
- Failures include explicit remediation owner and re-test step.
  Progress:
- 2026-02-12: Added `scripts/onboarding-deployed.mjs` and executed onboarding validation. Signup/verify passed via rate-limit fallback, but profile creation failed with HTTP 500. Blocker evidence and hypotheses captured in `plans/LP-068-069_BLOCKERS_2026-02-12.md`.
- 2026-02-13: After fixing invalid custom-domain route patterns and completing a new build/deploy, canonical-domain onboarding still fails at signup with `Error sending confirmation email`.
- 2026-02-13: `/app/processes` runtime 500 root cause fixed and smoke now passes; LP-068 remains blocked only on Supabase confirmation-email delivery (`Error sending confirmation email`).
- 2026-02-13: Supabase Auth logs confirmed SMTP failure (`535 Authentication credentials invalid`); repasting SMTP password in Supabase resolved signup confirmation sends.
- 2026-02-13: Updated `scripts/onboarding-deployed.mjs` to submit `?/action` POSTs with Svelte action headers so script behavior matches browser-enhanced forms.
- 2026-02-13: `src/lib/mailer.ts` switched to Cloudflare-safe static template rendering (no runtime Handlebars codegen), removing post-profile email-template runtime warnings.
  Status:
- Completed 2026-02-13 (`SMOKE_BASE_URL=https://systemscraft.co npm run -s onboarding:deployed` PASS at `2026-02-13T11:11:47.052Z` across signup, verification, profile, CRUD, search, and flag flows).

- [x] `LP-069` Multi-user workspace provisioning path.
      Acceptance:
- A tested method exists to add non-owner users to an existing org and assign `admin/editor/member` roles.
- If invite UX is deferred, a documented operational procedure exists for provisioning + role changes (with rollback).
- Smoke validation includes at least one non-owner user completing core `/app` traversal with role-appropriate permissions.
  Progress:
- 2026-02-12: Added `scripts/provision-workspace-members.mjs` and provisioned admin/editor/member successfully. Remaining closeout is non-owner smoke traversal blocked by `/app/processes` HTTP 500 on deployed environment. Details in `plans/LP-068-069_BLOCKERS_2026-02-12.md`.
- 2026-02-13: Re-ran smoke after deploy; `workers.dev` target now returns 404 for `/app/processes` while canonical domain still returns 500. Provisioning verification continues to pass.
  Status:
- Completed 2026-02-13 (provisioning script and rollback path implemented via `scripts/provision-workspace-members.mjs`; deployed smoke run on `https://systemscraft.co` now passes non-owner RBAC checks including admin/editor/member permission boundaries).

### WS8: Post-V1 Intelligence and Documentation (Data-Gated)

Gate policy for WS8:

- Each layer must be independently shippable and valuable on its own.
- Progression is strictly sequential and requires real customer data evidence before starting the next layer.
- Seed/dev/internal org data does not satisfy progression gates.

- [ ] `LP-070` Define and implement real customer data readiness gate.
      Acceptance:
- Telemetry exists for search queries, zero-result queries, click-through, and doc generation usage by `org_id`.
- Real customer orgs are explicitly distinguished from seed/dev/internal orgs in analytics.
- A written baseline threshold exists for moving from `LP-070` to `LP-071` (customer org count, query volume, entity corpus coverage).

- [ ] `LP-071` Deterministic retrieval quality baseline (no AI).
      Acceptance:
- Existing search (`LP-040` to `LP-043`) is enhanced with typo tolerance, synonym handling, and zero-result instrumentation.
- Search quality report uses real customer queries and includes baseline metrics (success proxy, zero-result rate, click-through).
- Exit gate to `LP-072` is documented and met using real customer data.

- [ ] `LP-072` Ad hoc documentation v1 (template-based, no LLM).
      Acceptance:
- Users can generate process/role/system docs in at least Markdown and one share format (HTML or PDF).
- Generated docs include source entity links, flag summary, and generated timestamp/version metadata.
- Adoption metrics and qualitative feedback are captured from real customer org usage.
- Exit gate to `LP-073` is documented and met using real customer data.

- [ ] `LP-073` NLP search beta (hybrid lexical + semantic) behind feature flag.
      Acceptance:
- Semantic retrieval (embedding/vector) is introduced behind org-level feature flags with rollback controls.
- Results show citation context and confidence/reason signals sufficient for user trust/debugging.
- Real-customer A/B comparison demonstrates measurable lift over `LP-071` baseline at acceptable latency/cost.
- Exit gate to `LP-074` is documented and met using real customer data.

- [ ] `LP-074` Ad hoc documentation v2 (LLM-assisted with citations + review).
      Acceptance:
- Users can generate narrative docs from atlas entities with mandatory source citations.
- Human review/approval is required before publish/export, with correction logging.
- Production readiness is based on factuality and correction-rate targets measured on real customer review samples.

## Execution Order With Dependencies

### Stage A: Foundation

1. `LP-004`, `LP-005`, `LP-006`, `LP-007` (marketing and IA clarity).
2. `LP-002`, `LP-003`, `LP-008` (app entry and semantics cleanup).

### Stage B: Data and security

1. `LP-010`, `LP-011`, `LP-012`, `LP-014`, `LP-015`, `LP-016`.
2. `LP-013` seed script after schema stabilizes.

### Stage C: App wiring and core launch execution (priority override)

1. `LP-020`, `LP-021`, `LP-022`, `LP-023`.
2. `LP-030` Roles CRUD.
3. `LP-031` Systems CRUD.
4. `LP-033` Action CRUD.
5. `LP-032` Processes CRUD + ordered action editor.
6. `LP-036` Field-level flag UI.
7. `LP-037` Right-rail flags on all `/app/*`.
8. `LP-040` Search backend endpoint.
9. `LP-041` Search overlay (`Ctrl-?`).
10. `LP-060` Cloudflare env setup (prod + preview).
11. `LP-061` Deployed smoke checklist + run.

### Stage D: Immediate closeout and rich-text decision path

1. `LP-062` Logging/error baseline.
2. `LP-064` Cloudflare deployment playbook.
3. `LP-063` Resolve or defer noisy legacy-route warnings.
4. Resolve rich-text path: complete `LP-051`/`LP-052`/`LP-053` or record explicit V1 de-scope decision in `V1_CHECKLIST.md` and this plan.
5. `LP-042` and `LP-043` retrieval polish follow after the rich-text decision unless explicitly re-scoped.
6. `LP-065` to `LP-069` customer onboarding readiness closeout.

### Stage E: Post-V1 intelligence (data-gated)

1. `LP-070` (customer-data telemetry + readiness gate).
2. `LP-071` deterministic retrieval improvements using real query logs.
3. `LP-072` ad hoc docs v1 (template-based).
4. `LP-073` NLP search beta (hybrid retrieval under feature flag).
5. `LP-074` ad hoc docs v2 (LLM-assisted + citations + review).

## Delivery Cadence (Suggested)

Use this as a planning baseline, not a hard date commitment.

Current founder-priority execution queue (as of 2026-02-12) supersedes the generic week buckets below until completed:

1. `LP-030`
2. `LP-031`
3. `LP-033`
4. `LP-032`
5. `LP-036`
6. `LP-037`
7. `LP-040`
8. `LP-041`
9. `LP-060`
10. `LP-061`
11. `LP-062`
12. `LP-064`
13. `LP-063`
14. Resolve `LP-051`/`LP-052`/`LP-053` path (ship or explicit V1 de-scope).
15. `LP-065`
16. `LP-066`
17. `LP-067`
18. `LP-068`
19. `LP-069`

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
- Post-launch (data-gated):
  - Layer 1: real-customer data gate + telemetry (`LP-070`).
  - Layer 2: deterministic retrieval quality baseline (`LP-071`).
  - Layer 3: ad hoc docs v1 template generation (`LP-072`).
  - Layer 4: NLP search beta (`LP-073`).
  - Layer 5: ad hoc docs v2 with citations and review (`LP-074`).

## Launch Sequence (Recommended)

1. `WS0` + `WS1` + `WS2` first (market-facing clarity, route clarity, schema truth).
2. `WS3` + `WS4` next (live data and CRUD).
3. Execute priority block in this order: `LP-030`, `LP-031`, `LP-033`, `LP-032`, `LP-036`, `LP-037`, `LP-040`, `LP-041`, `LP-060`, `LP-061`.
4. Immediate closeout order: `LP-062`, `LP-064`, `LP-063`.
5. Resolve rich-text path (`LP-051` to `LP-053`) or explicitly de-scope for V1 before launch sign-off.
6. Execute customer-onboarding readiness block: `LP-065`, `LP-066`, `LP-067`, `LP-068`, `LP-069`.
7. `WS8` only after launch and only with real customer data gates satisfied between each layer.

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
7. Use search (`Ctrl-?`) to find one process, one role, one system; verify deep-link navigation.
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
