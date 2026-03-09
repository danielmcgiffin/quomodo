# M-11 Audit Follow-Up Implementation Plan

Owner: Danny / Pi agent  
Date: 2026-03-08  
Status: Proposed follow-up sequence after M-11 audit

---

## 1) Objective

Convert the completed M-11 route audit into a focused implementation sequence that makes the app feel more **professional, attractive, clean, and coherent** without reopening broad scope.

This plan is intentionally split into small batches so each change can be verified visually and technically before the next one lands.

---

## 2) Inputs

### Audit source

- `../workbench/audit/m11-screen-audit/audit-artifacts/m11/REPORT.md`

### Planning inputs

- `plans/MASTER_PLAN.md`
- `plans/PRODUCT_FINDINGS.md`

### Audit conclusions that drive sequencing

1. List pages are the most visibly inconsistent part of the app.
2. Flags page has the highest scanability / information-density debt.
3. Detail pages work but still feel spatially timid, especially process detail.
4. App routes are missing document titles on many `/app/*` pages.
5. Process detail still emits a `dndzone` warning.
6. Mobile floating search button visually competes with content on several screens.

---

## 3) Guiding Design Direction

Use a single aesthetic direction across these follow-up batches:

> **Calm operations command center** — higher confidence, stronger hierarchy, less empty space, fewer visual one-offs.

Principles:
- More deliberate use of desktop width
- Shared card grammar across list pages
- Higher information density without clutter
- Fewer decorative differences between route families
- Clean headers and stronger browser/tab titles

---

## 4) Proposed Batch Sequence

## Batch 0 — Global polish pass

### Branch

- `fix/app-polish-titles-and-mobile-shell`

### Linear mapping

- no exact existing issue; may be bundled under `M-19` if kept small, otherwise create a small cleanup issue
- can include `H-05` if singular/plural fixes are truly tiny

### Goal

Fix the small professionalism leaks that appear across many routes.

### Scope

- Add proper document titles to app list/detail/account routes.
- Reduce or reposition the mobile floating search button so it stops competing with page content.
- Remove the `dndzone` warning on process detail.
- Optionally fix tiny obvious copy issues such as singular/plural rendering if they stay surgical.

### Likely files

- `src/lib/components/ScShell.svelte`
- `src/routes/app/processes/+page.svelte`
- `src/routes/app/roles/+page.svelte`
- `src/routes/app/systems/+page.svelte`
- `src/routes/app/flags/+page.svelte`
- `src/routes/app/team/+page.svelte`
- `src/routes/app/workspace/+page.svelte`
- `src/routes/app/processes/[slug]/+page.svelte`
- `src/routes/app/roles/[slug]/+page.svelte`
- `src/routes/app/systems/[slug]/+page.svelte`
- `src/lib/components/ProcessActionsSection.svelte`
- any small helper used for page-title composition

### Definition of done

1. No audited `/app/*` route returns a blank browser title.
2. Process detail no longer emits the `dndzone` warning.
3. Mobile floating search button no longer obscures or visually hijacks lower-left content on audited screens.
4. `npm run check`, `npm run lint`, and `npm run build` pass.

### Verification

- rerun screenshot audit on:
  - `/app/processes`
  - `/app/flags`
  - `/app/team`
  - `/app/processes/[slug]`
  - `/account/settings`
- confirm non-empty `page.title()` values

---

## Batch 1 — M-19 list-page unification

### Branch

- `feat/m19-list-grid-unification`

### Linear mapping

- `EPI-162` / `M-19`
- likely absorbs:
  - `EPI-91` / `M-19a`
  - `EPI-101` / `M-19b`

### Goal

Make `/app/processes`, `/app/roles`, and `/app/systems` feel like one product family instead of three unrelated route patterns.

### Scope

- Introduce a shared grid rhythm and card-shell language.
- Use desktop width more confidently.
- Align card anatomy across the three list pages:
  - title row
  - summary / description block
  - related entities / badges
  - action area
  - flag signal / metadata
- Keep each route’s content model distinct, but make the layout logic feel unified.

### Likely files

- `src/routes/app/processes/+page.svelte`
- `src/routes/app/roles/+page.svelte`
- `src/routes/app/systems/+page.svelte`
- `src/lib/components/ProcessCardList.svelte`
- shared portal / badge components if spacing or structure must be aligned
- `src/app.css`

### Definition of done

1. Processes, roles, and systems list pages all use intentional grid layouts on desktop.
2. Card spacing, header hierarchy, and action placement feel consistent across the three pages.
3. No route regresses on mobile; all three collapse cleanly to one-column mobile layouts.
4. Card clickability, badge clickability, and flag interactions still work.
5. `npm run check`, `npm run lint`, and `npm run build` pass.

### Verification

- before/after desktop board for:
  - `/app/processes`
  - `/app/roles`
  - `/app/systems`
- mobile screenshots for the same three routes
- manual click-through from each card type into its detail route

---

## Batch 2 — H-03 detail header + composition polish

### Branch

- `fix/h03-detail-header-polish`

### Linear mapping

- `EPI-147` / `H-03`
- may include low-risk parts of `H-04` if background/surface alignment naturally belongs here

### Goal

Make detail pages feel more confident and less spatially timid, starting with the process detail header and then aligning role/system detail composition as needed.

### Scope

- Strengthen process detail title/header layout.
- Clean up crowded title/icon/control combinations on mobile.
- Use desktop width more intentionally on process, role, and system detail pages.
- Reduce dead-space feeling without adding ornamental clutter.

### Likely files

- `src/routes/app/processes/[slug]/+page.svelte`
- `src/routes/app/roles/[slug]/+page.svelte`
- `src/routes/app/systems/[slug]/+page.svelte`
- `src/lib/components/ProcessDetailHeader.svelte`
- `src/lib/components/RoleDetailHeader.svelte`
- `src/lib/components/SystemDetailHeader.svelte`
- `src/app.css`

### Definition of done

1. Process detail header no longer feels cramped on mobile or underweighted on desktop.
2. Detail-page content blocks use available width more effectively.
3. Role/system detail pages feel visually related to process detail rather than coincidentally similar.
4. `npm run check`, `npm run lint`, and `npm run build` pass.

### Verification

- before/after screenshots for:
  - `/app/processes/[slug]`
  - `/app/roles/[slug]`
  - `/app/systems/[slug]`
- mobile screenshots for the same three routes

---

## Batch 3 — M-18 flag-surface refinement

### Branch

- `feat/m18-flag-surface-refinement`

### Linear mapping

- `EPI-141` / `M-18`
- `EPI-142` / `M-18a`
- `EPI-143` / `M-18b`
- `EPI-144` / `M-18c`
- `EPI-145` / `M-18d`

### Goal

Turn flags from repetitive maintenance records into clearer operational signals.

### Scope

- Make the flag-origin link go to the source surface, not the dashboard.
- Add resolved history with timestamp + actor.
- Add resolve-comment input.
- Place flag indicator icons next to item titles as planned.
- Tighten flag-card information density so the page scans better on desktop and mobile.

### Likely files

- `src/routes/app/flags/+page.svelte`
- `src/routes/app/flags/+page.server.ts`
- `src/lib/components/FlagBadgeModal.svelte`
- list/detail components that show title-adjacent flag indicators
- flag data helpers / server mappers as needed
- `src/app.css`

### Definition of done

1. Flag origin links always lead to the place the flag was created.
2. Resolving a flag supports a short comment.
3. Resolved history is visible with actor + time.
4. Flag cards become easier to scan and less vertically empty.
5. `npm run check`, `npm run lint`, and `npm run build` pass.

### Verification

- desktop + mobile screenshots of `/app/flags`
- modal interaction pass on create / resolve / history paths
- at least one manual deep-link test from modal to source route

---

## Batch 4 — H-02 + first performance follow-up

### Branch

- `perf/h02-process-detail-and-session-waterfall`

### Linear mapping

- `EPI-146` / `H-02`
- `EPI-153` / `TODO-02`
- `EPI-152` / `TODO-01`
- optionally `EPI-154` / `TODO-03` if discovery shows it belongs in the same pass

### Goal

Improve the perceived responsiveness of process detail and authenticated app navigation after the visual polish work lands.

### Scope

- Parallelize `getUser()` + MFA AAL in `safeGetSession`.
- Parallelize process-detail flags query.
- If still justified, collapse `ensureOrgContext` into a single query / RPC.
- Measure before/after on audited routes.

### Likely files

- `src/hooks.server.ts`
- `src/routes/app/processes/[slug]/+page.server.ts`
- `src/lib/server/atlas.ts`
- maybe shared loader helpers if the refactor needs consolidation

### Definition of done

1. Route-load timing on process detail improves measurably.
2. No auth/session regression is introduced.
3. All existing checks and relevant tests pass.
4. Performance work remains surgically scoped and does not expand into unrelated loader rewrites.

### Verification

- `npm run check`
- `npm run lint`
- `npm run build`
- route timing script before/after on:
  - `/app/processes`
  - `/app/processes/[slug]`
  - `/account/settings`

---

## 5) Recommended Execution Order

If only one batch is taken next, do this:

1. **Batch 1 — `M-19` list-page unification**
2. **Batch 0 — global polish pass** if not folded into Batch 1
3. **Batch 2 — `H-03` detail header + composition polish**
4. **Batch 3 — `M-18` flag-surface refinement**
5. **Batch 4 — `H-02` + perf follow-up**

Reasoning:
- Batch 1 gives the fastest broad quality jump.
- Batch 2 improves the most important deep-view surfaces.
- Batch 3 makes the noisiest route more useful.
- Batch 4 improves feel after the visual issues are reduced.

---

## 6) Out of Scope for These Batches

- inline editing redesign (`H-01`) unless a specific batch naturally touches it
- production error reporting (`M-12`)
- demo workspace preparation (`M-13`)
- broad componentization/tokenization program (`H-06`)
- algorithmic/data-layer cleanup outside the named perf tasks

---

## 7) Verification Discipline

Every batch should:

1. run in its own worktree / branch
2. ship with before/after screenshots for touched routes
3. pass:
   - `npm run check`
   - `npm run lint`
   - `npm run build`
4. rerun the mini-audit on the touched surfaces before merge

Do **not** bundle Batch 1, 2, 3, and 4 into a single PR.

---

## 8) Immediate Next Action

Create worktree + branch for:

- `feat/m19-list-grid-unification`

and start with:
- `/app/processes`
- `/app/roles`
- `/app/systems`

using the audit boards as the before-state baseline.
