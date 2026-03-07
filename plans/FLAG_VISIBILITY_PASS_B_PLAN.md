# Pass B Plan — Modal-First Flag Visibility

Owner: Danny / Pi agent  
Date: 2026-03-06  
Status: Implemented

---

## 1) Objective

Complete the post-sidebar flag UX by making flag status visible in-context through **clickable inline badges + modals**, while keeping `/app/flags` as the canonical moderation inbox for full moderation views.

This is the second pass after Pass A (sidebar removal + primary inline counts).

---

## 2) Baseline (already done in Pass A)

- Per-page `FlagSidebar` removed from process/role/system list + detail pages.
- Inline flag count indicators added for:
  - process cards,
  - role cards,
  - system cards,
  - process/system/role detail titles,
  - process action cards.
- Current inline indicators are display-only counts; they do not open contextual modals yet.

---

## 3) Pass B Outcomes (definition of done)

1. Every inline flag indicator in scope opens an in-context modal first, instead of navigating away immediately.
2. Direct-flag badges represent only the target entity itself.
   - Process detail title badge becomes process-only.
   - Process action badges remain action-only.
   - Role/system/detail/list badges remain direct-only.
3. Surface-specific outlined related badges represent only flags on entities that are visibly rendered on that surface.
   - Process detail header gets a related badge for visible linked roles + systems.
   - Role detail `Actions` tab gets a related badge for visible linked processes + systems.
   - System detail header gets a related badge for visible linked processes + roles.
   - Process list cards may get a related badge for visible role/system portals.
   - Related counts are **surface-specific**, deduped by flag ID, and do **not** include child items that already have their own direct badges on that surface.
4. Direct and related badges open **separate modals**.
   - Direct modal shows only open direct flags for that target.
   - Related modal shows only open related flags, grouped by visible linked entity in visual order.
5. Members get read-only modal views.
6. Owners/admins/editors can resolve or dismiss open flags directly inside the modal.
7. For owners/admins/editors, modal rows can deep-link to `/app/flags` filtered to the broader entity (not field-specific).
8. `/app/flags` supports URL-driven filtering and defaults to `status=open`.
9. No sidebar reintroduction.
10. `npm run check`, `npm run lint`, `npm run build` all pass.

---

## 4) Scope

### In scope

- Modal-first behavior for all existing inline flag indicators in scope.
- Direct open-flag modals for current entity badges.
- Surface-specific outlined related-flag badges where specific linked entities are visibly rendered.
- Shared flag-index utility for loader-level aggregation and modal population.
- URL query filtering on `/app/flags`.
- Inline resolve/dismiss actions inside flag modals for elevated roles.
- Minimal visual treatment (consistent with current compact `sc-` UI).

### Out of scope

- New flag statuses/types/workflows.
- Schema migrations.
- Field-specific `/app/flags` deep-links from modal rows.
- Related badges on surfaces that only show summary counts and not specific linked entities.
- Moderation workflow redesign beyond modal affordance + `/app/flags` filtering.

---

## 5) Technical Plan

## Workstream A — Shared flag index utility + modal data helpers

Create a small server-side utility to avoid repeating target-count logic across loaders and to support modal payload construction.

**Proposed file:**

- `src/lib/server/app/mappers/flag-index.ts`

**Core API:**

- `buildOpenFlagIndex(rows)`
- `getEntityFlagCount(index, targetType, targetId)`
- `getEntityFlags(index, targetType, targetId)`
- `getVisibleRelatedFlags(index, visibleTargets)`

**Input row shape:**

- `id`, `target_type`, `target_id`, `target_path`, `flag_type`, `message`, `created_at` (open flags only)

**Notes:**

- Count by entity key (`type:id`); preserve row collections for modal rendering.
- Keep implementation pure (no DB calls inside utility).
- Related collections must dedupe by flag ID.
- Preserve the incoming visible-target order so grouped modals follow visual order.

---

## Workstream B — `/app/flags` filter/deep-link support

Add URL-driven filtering in flags dashboard.

**Files:**

- `src/routes/app/flags/+page.server.ts`
- `src/routes/app/flags/+page.svelte`

**Query params (proposed):**

- `status=open|resolved|dismissed` (default: `open`)
- `targetType=process|role|system|action`
- `targetId=<uuid>`

**Behavior:**

- Server filters `flags` query from params.
- UI reflects active filter state (header subtitle/chips).
- Existing create/resolve/dismiss actions remain unchanged.
- Modal links use broader entity filters only (`targetType` + `targetId`).

---

## Workstream C — Shared badge/modal primitives

Add reusable direct/related badge components and modal components so existing inline indicators can be upgraded without duplicating interaction logic.

**Files:**

- `src/lib/components/*` as needed
- `src/app.css`

**Behavior:**

- Direct badges open a direct-flags modal.
- Related outlined badges open a separate related-flags modal.
- Member modal is read-only.
- Owner/admin/editor modal allows resolve + dismiss in place.
- Elevated-user modal rows can link to filtered `/app/flags`.

---

## Workstream D — Retrofit existing direct indicators to modal-first behavior

Upgrade current inline indicators so they no longer act as passive counts.

**Files (representative):**

- `src/lib/components/ProcessDetailHeader.svelte`
- `src/lib/components/ProcessActionsSection.svelte`
- `src/lib/components/SystemDetailHeader.svelte`
- `src/routes/app/roles/[slug]/+page.svelte`
- `src/lib/components/ProcessCardList.svelte`
- `src/routes/app/roles/+page.svelte`
- `src/routes/app/systems/+page.svelte`

**Notes:**

- Process detail header direct badge becomes process-only.
- Existing action direct badges remain action-only.

---

## Workstream E — Process detail related indicators

**Files:**

- `src/routes/app/processes/[slug]/+page.server.ts`
- `src/routes/app/processes/[slug]/+page.svelte`

**Targets on page:**

- direct `process` flags in top solid badge,
- direct `action` flags on action cards,
- related visible `role` flags,
- related visible `system` flags.

**UI behavior:**

- Top outlined related badge summarizes visible linked role + system flags.
- Related modal excludes action flags because actions already have their own direct badges on this surface.

---

## Workstream F — Role detail related indicators

**Files:**

- `src/routes/app/roles/[slug]/+page.server.ts`
- `src/routes/app/roles/[slug]/+page.svelte`
- `src/lib/server/app/mappers/detail-relations.ts`

**Targets on page:**

- direct `role` flags in the title area,
- related visible `process` flags in the `Actions` tab,
- related visible `system` flags in the `Actions` tab.

**UI behavior:**

- Outlined related badge lives next to the `Actions` tab label, not in the page header.
- No related badge on `Role Details` in this pass.

---

## Workstream G — System detail related indicators

**Files:**

- `src/routes/app/systems/[slug]/+page.server.ts`
- `src/routes/app/systems/[slug]/+page.svelte`
- `src/lib/server/app/mappers/detail-relations.ts`

**Targets on page:**

- direct `system` flags in top solid badge,
- related visible `process` flags,
- related visible `role` flags.

**UI behavior:**

- Top outlined related badge summarizes visible linked process + role flags.

---

## Workstream H — List-surface related indicators

**Files:**

- `src/lib/components/ProcessCardList.svelte`
- list loaders/mappers as needed

**Behavior:**

- Process list cards may show a related outlined badge because they visibly render linked role/system portals.
- Role/system list pages follow the current strict surface rule: only count visible linked entities rendered on the card/page today.
- This intentionally allows process cards to have richer related orientation than role/system list cards for now.

---

## Workstream I — Visual consistency + interaction polish

**Files:**

- `src/app.css`
- badge/modal components as needed

**Rules:**

- Reuse compact `sc-flag-indicator` token where possible.
- Add a distinct outlined treatment for related badges.
- Avoid adding dense/chunky secondary UI.
- Keep motion minimal (no hover lift reintroduction).

---

## 6) Delivery Sequence

1. Implement Workstream A (utility + unit tests).
2. Implement Workstream B (`/app/flags` filtering).
3. Implement Workstream C (shared badge/modal primitives).
4. Retrofit existing direct indicators (D).
5. Process detail related indicators (E).
6. Role detail related indicators (F).
7. System detail related indicators (G).
8. List-surface related indicators (H).
9. Polish + QA (I).

If risk appears during E/F/G/H, ship each surface in separate incremental PR-sized commits.

---

## 7) Verification Plan

### Automated

```bash
npm run check
npm run lint
npm run build
```

Add or update mapper/component tests for:

- `/app/flags` query-param parsing + default `status=open`
- direct-vs-related count aggregation
- related dedupe by flag ID
- related grouping in visual order
- role/system/process surface-specific inclusion rules

### Manual QA matrix

- Every inline direct badge opens a direct-flags modal.
- Member modal is read-only.
- Owner/admin/editor modal allows resolve + dismiss without closing the modal.
- Process detail:
  - top solid badge shows process-only open flags,
  - action badges show action-only open flags,
  - top outlined badge shows visible linked role/system flags only.
- Role detail:
  - title badge shows direct role flags only,
  - `Actions` tab badge shows visible linked process/system flags only.
- System detail:
  - top solid badge shows direct system flags only,
  - top outlined badge shows visible linked process/role flags only.
- Related modal groups flags by linked entity and follows visual order.
- Elevated-user modal row links open `/app/flags` with broader entity filter.
- `/app/flags` defaults to `open` when no status filter is provided.
- Empty direct/related states render cleanly.

---

## 8) Risks and mitigations

- **Risk:** Extra flag queries become heavy on larger orgs.  
  **Mitigation:** Keep modal/query data constrained to `status=open` and visible target ID sets.

- **Risk:** Inconsistent indicator semantics across components.  
  **Mitigation:** Centralize direct/related semantics in shared badge + modal primitives.

- **Risk:** Direct and related counts get conflated on pages with child item badges.  
  **Mitigation:** Exclude child items that already have their own direct badge from page-level related counts.

- **Risk:** Filter links drift from server param contract.  
  **Mitigation:** Define and document param schema once in `/app/flags` loader.

---

## 9) Rollback strategy

- UI-only rollback: remove modal-trigger badges/usages and keep Pass A passive counts.
- Data rollback: retain utility file but stop wiring it into loaders/components.
- `/app/flags` filters can be disabled without impacting flag creation.
