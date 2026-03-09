# M-21 Flag History Timeline Plan

Owner: Danny / Pi agent  
Date: 2026-03-09  
Status: Ready for implementation handoff

Linear: `EPI-169`  
Master mapping: `M-21` (new)

Related:
- `plans/MASTER_PLAN.md`
- `src/routes/app/flags/+page.server.ts`
- `src/routes/app/flags/+page.svelte`
- `src/lib/components/FlagsCardList.svelte`
- `src/lib/server/app/mappers/flags.ts`

---

## 1) Objective

Upgrade `/app/flags` so resolved/dismissed records are no longer a small section at the bottom of the Open view.

Deliver a **dedicated History tab** with:
1. timeline-first layout
2. search
3. sticky date indicator on the left that updates as the user scrolls

Target outcome: history feels intentional and operationally useful, not an afterthought.

---

## 2) Requirement Interpretation (explicit assumptions)

Based on `EPI-169` title text:

> "Flag Resolved history should be on a separate tab in a searchable timeline structure, with day/month/year indicator on the left that changes as you scroll"

Assumptions for implementation:
1. History includes both `resolved` and `dismissed` statuses (default = both).
2. Timeline ordering is newest-first by `resolved_at`.
3. Search should cover at least `message` and `resolution_note`; include target label and resolver label when available.
4. Open flags remain in the existing Open tab with current moderation flows unchanged.
5. URL should encode tab/filter/search state so links are shareable.

If any of these are wrong, update before coding.

---

## 3) Current Baseline

Current behavior:
- `/app/flags` shows Open flags grid (`FlagsCardList`).
- On Open status only, a secondary "Resolved history" section appears below, currently capped (`limit(40)`).
- No dedicated tab and no search for history.
- No timeline grouping and no sticky date rail.

Technical baseline:
- Loader already fetches resolved/dismissed records (`resolvedHistoryResult`).
- Mappers currently output display-ready strings (`createdAt`, `resolvedAt`) but not raw timestamps for robust timeline grouping.
- Existing indexes do not include a timeline-friendly `resolved_at` index for resolved/dismissed queries.

---

## 4) UX Spec (target experience)

## A. Top-level tabs

At top of `/app/flags` content area:
- `Open`
- `History`

Behavior:
- Open tab: existing open-flag workflow (resolve/dismiss/delete) unchanged.
- History tab: timeline + search controls.

## B. History controls

Controls row (History tab):
1. Search input (`q`) with submit + clear affordance.
2. Status filter pills:
   - `All`
   - `Resolved`
   - `Dismissed`
3. Result count label (e.g., `128 results`).

## C. Timeline layout

Desktop:
- Left rail: sticky date indicator (month/day/year) that updates with scroll position.
- Right stream: grouped timeline entries (grouped by day).

Mobile:
- Left rail collapses to sticky top inline date indicator.
- Timeline entries remain grouped by day.

## D. Timeline entry card

Each entry shows:
- flag type badge
- original message (clickable origin link)
- target chip (process/role/system/action portal)
- status chip (`Resolved` / `Dismissed`)
- resolved timestamp
- actor
- optional resolution note

Design intent:
- denser and more list-like than open post-it cards
- still aligned with SystemsCraft visual language

## E. Empty states

History tab empty states:
- no history records: “No resolved/dismissed flags yet.”
- search with zero matches: “No history matches for ‘…’.” with quick clear action.

---

## 5) URL + State Contract

Add explicit view/query contract:

- `view=open|history` (default: `open`)
- `historyStatus=all|resolved|dismissed` (default: `all`, only used when `view=history`)
- `q=<search term>` (history search term)
- `targetType` + `targetId` (existing deep-link filter, preserved)

Backward compatibility:
- legacy `status=open|resolved|dismissed` should still parse.
- if `status=resolved|dismissed` and `view` omitted, redirect behavior to history view semantics in loader mapping (without breaking old links).

---

## 6) Data-layer + Server Implementation

## A. Mapper contract expansion

File: `src/lib/server/app/mappers/flags.ts`

Add:
- timeline/search param parser (or extend existing parser)
- raw ISO timestamp fields on mapped entries (keep formatted fields for compatibility)
- optional timeline grouping helper:
  - group key: `YYYY-MM-DD` based on `resolvedAt`
  - display labels: weekday/month/day/year

## B. Loader split by view

File: `src/routes/app/flags/+page.server.ts`

Refactor loader into two explicit paths:
1. Open dataset query (existing behavior)
2. History dataset query (resolved/dismissed, search + status filtering)

History query behavior:
- base filter: `org_id`, status set
- ordering: `resolved_at desc`, then `id desc`
- optional `targetType/targetId`
- optional search (`message` / `resolution_note`)
- configurable page limit (e.g., 60)

## C. Search behavior

Phase-1 (recommended): server-side filtering with `ilike` for:
- `message`
- `resolution_note`

Optional phase-2 refinement:
- include target/resolver labels in search via computed search blob or FTS/RPC path.

## D. Query performance hardening

Add migration:

`supabase/migrations/<timestamp>_flags_history_timeline_index.sql`

```sql
create index if not exists flags_org_resolved_timeline_idx
  on public.flags (org_id, resolved_at desc, id desc)
  where status in ('resolved', 'dismissed');
```

Rationale: keeps timeline query fast as history grows.

---

## 7) UI Implementation Plan

## A. Route page composition

File: `src/routes/app/flags/+page.svelte`

Changes:
- replace inline resolved-history section with tabbed layout.
- Open tab renders `FlagsCardList` as today.
- History tab renders new timeline component.

## B. New component

Create: `src/lib/components/FlagsHistoryTimeline.svelte`

Responsibilities:
- render grouped timeline entries
- render sticky date rail (desktop)
- render sticky inline date chip (mobile)
- handle active-group tracking via `IntersectionObserver`
- expose lightweight, accessible markup

## C. Styling

Primary file: `src/app.css` (shared styles)

Add scoped timeline classes:
- `.sc-flag-history-layout`
- `.sc-flag-history-rail`
- `.sc-flag-history-rail-sticky`
- `.sc-flag-history-group`
- `.sc-flag-history-item`
- responsive rules for mobile collapse

Polish target:
- smooth scroll feel
- no jumpy rail updates
- clear visual hierarchy between day-groups and entries

---

## 8) Accessibility + Interaction Quality

Requirements:
- Tabs use semantic `role="tablist"`, `role="tab"`, `aria-selected`.
- Search has label and clear control accessible by keyboard.
- Date rail is decorative + mirrored by visible headings in stream (screen-reader-safe).
- Timeline headings remain in DOM order (`h3`) for navigability.
- Focus styles preserved on links/buttons.

---

## 9) Test + Verification Plan

## A. Unit tests

File updates:
- `src/lib/server/app/mappers/flags.test.ts`

Add coverage for:
1. new URL parse behavior (`view`, `historyStatus`, `q`, legacy `status` fallback)
2. timeline grouping helper (day boundaries + sort order)
3. mapped history entries retain required fields (`resolvedAtIso`, `resolvedByLabel`, `originHref`)

## B. Manual QA matrix

1. Open tab unchanged (resolve/dismiss/delete still work).
2. History tab displays grouped timeline.
3. Search returns expected subsets.
4. Status filter pills (`all/resolved/dismissed`) work with search.
5. Left date indicator updates while scrolling desktop timeline.
6. Mobile timeline remains usable and date context is visible.
7. Deep links (`targetType/targetId`) still work and can switch tabs without losing context.
8. Copy-link behavior still points to correct section/item.

## C. Standard gates

```bash
npm run check
npm run lint
npm run build
npm run test_run
```

---

## 10) Rollout Sequence (small batches)

1. **Batch A (contract + data):** parser, loader split, mapper updates, tests.
2. **Batch B (UI shell):** tabs + history controls + basic timeline list.
3. **Batch C (interaction polish):** sticky date rail with observer + mobile behavior.
4. **Batch D (perf hardening):** index migration + re-check query timing.

Keep each batch mergeable and verified independently.

---

## 11) Risks + Mitigations

1. **Risk:** Scroll indicator feels jittery.  
   **Mitigation:** threshold tuning + active-group debouncing.

2. **Risk:** Search becomes slow at scale.  
   **Mitigation:** server-side filtering + timeline index + bounded page size.

3. **Risk:** URL state confusion (`status` vs `view`).  
   **Mitigation:** single parser with explicit precedence and tests.

4. **Risk:** Open tab regressions from shared component changes.  
   **Mitigation:** isolate new timeline component; keep `FlagsCardList` mostly untouched.

---

## 12) Definition of Done

`M-21` / `EPI-169` is done when:

1. `/app/flags` has separate `Open` and `History` tabs.
2. History tab is searchable.
3. History renders grouped timeline entries with date context.
4. Desktop has a left sticky date indicator that updates with scroll.
5. Open flag moderation workflows remain correct.
6. URL state is shareable and backward-compatible with legacy status links.
7. tests + check/lint/build all pass.

---

## 13) Immediate Next Action

Create implementation branch:

- `feat/m21-flags-history-timeline`

Start with **Batch A** (data contract + loader split + tests) before any visual styling work.
