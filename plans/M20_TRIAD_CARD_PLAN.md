# M-20 Triad Card Plan

Owner: Danny / Pi agent  
Date: 2026-03-09  
Status: Ready for implementation handoff

Linear: `EPI-164` / `M-20`

---

## 1) Objective

Standardize atlas list cards around a single, scan-friendly grammar so `/app/processes`, `/app/roles`, and `/app/systems` feel like the same product surface.

This is a follow-up to `M-19`.

- `M-19` solved grid rhythm and baseline card consistency.
- `M-20` solves **what information belongs on the card**.

The main goal is to make cards easier to scan and less likely to grow to uneven heights.

---

## 2) Locked Decisions

These decisions are settled and should guide implementation:

1. **Cards only show two content rows:**
   - title row
   - relationship summary row
2. **No rich text or description body on atlas list cards.**
3. **Flag icons belong inline with the title row, not as detached floating clusters.**
4. **Relationship summaries are the card-level information model.**
5. **Whole card still opens the detail slide-in.**
6. **Relationship links must remain directly clickable.**
7. **Mobile keeps the same grammar, only collapsed/responsive.**

---

## 3) Shared Card Grammar

Every atlas list card should use this structure:

### Row 1 — Title row

Purpose: identify the entity immediately and show flag state without forcing the eye to hunt.

Contents:
- existing entity marker if useful in-context
  - process: optional plain title only
  - role: avatar/initials may stay
  - system: system icon may stay
- entity title
- inline flag affordances next to the title
  - direct flag badge/modal trigger
  - related flag badge/modal trigger where applicable
  - create-flag affordance

Rules:
- title is the primary visual element
- keep the row compact and horizontally aligned
- title should clamp before the row becomes tall
- do not place flag controls in a detached top-right action cluster unless absolutely necessary to preserve behavior

### Row 2 — Relationship summary row

Purpose: summarize the triad connections at a glance.

Contents:
- compact relationship groups only
- each group should read as a small summary item, not a paragraph
- no descriptive copy
- no rich text

Recommended at-rest shape:
- label + count or label + single owner name
- examples:
  - `Roles · 3`
  - `Systems · 2`
  - `Processes · 5`
  - `Owner · Finance`

---

## 4) Per-Entity Content Rules

## Process cards

Show:
- title row with inline flag icons
- relationship summary row with:
  - roles involved
  - systems used

Do not show:
- description rich text
- extra subtitle copy
- freeform metadata blocks

## Role cards

Show:
- title row with inline flag icons
- relationship summary row with:
  - processes involved in
  - systems connected

Do not show:
- description rich text
- long explanatory copy

## System cards

Show:
- title row with inline flag icons
- relationship summary row with:
  - owner
  - connected processes
  - connected roles

Do not show:
- description rich text
- location copy as a body section

Notes:
- external/location link can remain as a small secondary affordance if needed, but it should not create a third major card row
- owner belongs in the relationship summary grammar, not in a separate prose block

---

## 5) Relationship Summary Interaction Model

Relationship summaries should be compact at rest and reveal actual links on interaction.

### Desktop

- hovering a relationship group should reveal a small list of clickable related entities
- keyboard focus should reveal the same content
- clickable links inside the revealed state must remain above the card overlay

### Mobile

- tapping a relationship group should reveal the same related-entity links
- the mobile interaction may be a tap-to-toggle popover, inline expansion, or similarly light pattern
- do not introduce a completely different mobile card model

### Accessibility / behavior rules

- relationship groups must be real interactive controls when they reveal content
- focus states must be visible
- revealed links must be keyboard reachable
- clicking outside an interactive control on the card should still open the detail slide-in

---

## 6) Height / Density Guidance

No exact pixel height is required, but cards should land in a narrow, predictable visual range.

Target principles:
- remove arbitrary height growth from long descriptions
- keep most cards within a similar height band
- allow title clamping rather than card bloat
- allow the relationship row to wrap responsibly on smaller widths

Practical implementation guidance:
- title may use up to 2 lines if needed
- avoid a third content row
- prefer compact summary chips/items over stacked prose

---

## 7) Implementation Guardrails

### Keep
- whole-card slide-in behavior
- clickable role/system/process portals
- inline flag creation flow
- direct + related flag modal behavior

### Avoid
- broad abstraction for its own sake
- rewriting unrelated detail pages
- reintroducing long text blocks on cards
- moving card interactions into routes not already part of `M-20`

### Preferred implementation style

Use the minimum shared abstraction needed.

Reasonable options:
- a small shared relationship-summary component
- a small shared title-row helper
- or a few aligned local implementations if that is simpler

Do **not** build a large generic card framework unless it proves necessary.

---

## 8) Suggested Junior Split

### Track A — shared/process reference implementation

Goal:
- implement the final grammar on process cards first
- establish the relationship-summary interaction pattern

Likely files:
- `src/lib/components/ProcessCardList.svelte`
- optional shared helper such as `src/lib/components/AtlasRelationshipSummary.svelte`
- minimal supporting styles

### Track B — roles + systems adoption

Goal:
- apply the same two-row grammar to role and system cards
- adapt owner handling for systems within the same summary model

Likely files:
- `src/routes/app/roles/+page.svelte`
- `src/routes/app/systems/+page.svelte`
- minimal supporting styles

Integration note:
- prefer component-local styles or narrowly scoped shared classes to reduce merge conflict risk
- if a shared helper is introduced on Track A, Track B should either consume it or mirror its contract closely

---

## 9) Definition of Done

`M-20` is done when:

1. process, role, and system cards all use the same two-row grammar
2. no list card shows rich text / description bodies
3. title rows contain the flag affordances inline
4. relationship summaries communicate the triad connections at rest
5. hover/focus/tap reveals real clickable related-entity links
6. whole-card slide-in still works outside interactive sub-elements
7. mobile still reads cleanly and uses the same content grammar
8. `npm run check`, `npm run lint`, and `npm run build` pass

---

## 10) Verification

Before merge, verify:

### Visual
- desktop and mobile screenshots of:
  - `/app/processes`
  - `/app/roles`
  - `/app/systems`
- card heights feel predictably aligned
- descriptions no longer dominate card height

### Interaction
- whole-card click opens detail slide-in on all three pages
- direct/related flag icons still work
- create-flag affordance still works
- relationship summary interactions reveal clickable related links
- revealed links navigate correctly

### Technical
- `npm run check`
- `npm run lint`
- `npm run build`

---

## 11) Out of Scope

Not part of `M-20`:
- detail-header redesign (`H-03`)
- flag-origin/history/resolve-comment work (`M-18`)
- broader componentization push (`H-06`)
- performance work (`H-02`, `TODO-01`, `TODO-02`, `TODO-03`)

`M-20` is specifically about **card content grammar and scanability on the atlas list pages**.
