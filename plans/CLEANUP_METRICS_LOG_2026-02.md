# Cleanup Metrics Log (2026-02)

This file records point-in-time metric snapshots during the cleanup project, so we can compare against the CLEANUP-00 baseline in `plans/CLEANUP_BASELINE_2026-02.md`.

## Snapshot: 2026-02-14T08:51:17-05:00 (post EPI-39)

Git:

- Commit: `4c46956` (EPI-39)

Totals vs CLEANUP-00 baseline (`plans/CLEANUP_BASELINE_2026-02.md`):

- App route files total lines: **5519** (baseline 5521, delta -2)
- `src/lib/server/app/**/*` total lines: **2346** (baseline 2194, delta +152)
- `src/lib/components/*.svelte` total lines: **1971** (baseline 1971, delta 0)

### App Route Line Counts

```text
  5519 total
   777 src/routes/app/processes/[slug]/+page.server.ts
   722 src/routes/app/team/+page.server.ts
   502 src/routes/app/processes/[slug]/+page.svelte
   427 src/routes/app/systems/[slug]/+page.svelte
   382 src/routes/app/team/+page.svelte
   367 src/routes/app/roles/[slug]/+page.svelte
   264 src/routes/app/systems/+page.svelte
   252 src/routes/app/systems/[slug]/+page.server.ts
   250 src/routes/app/roles/[slug]/+page.server.ts
   245 src/routes/app/processes/+page.server.ts
   240 src/routes/app/flags/+page.server.ts
   221 src/routes/app/workspace/+page.server.ts
   186 src/routes/app/systems/+page.server.ts
   173 src/routes/app/roles/+page.svelte
   166 src/routes/app/workspace/+page.svelte
   146 src/routes/app/roles/+page.server.ts
   131 src/routes/app/processes/+page.svelte
    68 src/routes/app/flags/+page.svelte
```

### Shared Module Line Counts (`src/lib/server/app/**/*`)

```text
 2346 total
  586 src/lib/server/app/actions/shared.ts
  493 src/lib/server/app/actions/shared.test.ts
  353 src/lib/server/app/mappers/search.ts
  218 src/lib/server/app/mappers/search.test.ts
  177 src/lib/server/app/mappers/flags.ts
  160 src/lib/server/app/mappers/detail-relations.ts
  159 src/lib/server/app/mappers/processes.ts
   71 src/lib/server/app/mappers/flags.test.ts
   54 src/lib/server/app/mappers/directory.ts
   38 src/lib/server/app/mappers/portals.test.ts
   35 src/lib/server/app/mappers/portals.ts
    2 src/lib/server/app/actions/index.ts
```

### Component Line Counts (`src/lib/components/*.svelte`)

```text
 1971 total
  235 src/lib/components/AppSearchOverlay.svelte
  223 src/lib/components/ScShell.svelte
  189 src/lib/components/ProcessActionsSection.svelte
  176 src/lib/components/RichTextEditor.svelte
  149 src/lib/components/InlineEntityFlagControl.svelte
  140 src/lib/components/ActionEditorModal.svelte
  112 src/lib/components/ProcessCardList.svelte
   98 src/lib/components/ProcessOverviewCard.svelte
   91 src/lib/components/InlineCreateSystemModal.svelte
   85 src/lib/components/ScModal.svelte
   80 src/lib/components/CreateProcessModal.svelte
   67 src/lib/components/InlineCreateRoleModal.svelte
   57 src/lib/components/FlagsCardList.svelte
   53 src/lib/components/FlagSidebar.svelte
   52 src/lib/components/FlagsCreateForm.svelte
   50 src/lib/components/ProcessTraverseCard.svelte
   39 src/lib/components/SystemPortal.svelte
   35 src/lib/components/RolePortal.svelte
   32 src/lib/components/ProcessPortal.svelte
    8 src/lib/components/RichText.svelte
```

## Snapshot: 2026-02-14T08:57:34-05:00 (post EPI-41)

Git:

- Commit: `0afed88` (EPI-41)

Totals vs CLEANUP-00 baseline (`plans/CLEANUP_BASELINE_2026-02.md`):

- App route files total lines: **5416** (baseline 5521, delta -105)
- `src/lib/server/app/**/*` total lines: **2441** (baseline 2194, delta +247)
- `src/lib/components/*.svelte` total lines: **1971** (baseline 1971, delta 0)

Highlights:

- `src/routes/app/processes/[slug]/+page.server.ts`: 777 -> 711 (delta -66)
- `src/routes/app/flags/+page.server.ts`: 241 -> 203 (delta -38)

### App Route Line Counts

```text
  5416 total
   722 src/routes/app/team/+page.server.ts
   711 src/routes/app/processes/[slug]/+page.server.ts
   502 src/routes/app/processes/[slug]/+page.svelte
   427 src/routes/app/systems/[slug]/+page.svelte
   382 src/routes/app/team/+page.svelte
   367 src/routes/app/roles/[slug]/+page.svelte
   264 src/routes/app/systems/+page.svelte
   252 src/routes/app/systems/[slug]/+page.server.ts
   250 src/routes/app/roles/[slug]/+page.server.ts
   245 src/routes/app/processes/+page.server.ts
   221 src/routes/app/workspace/+page.server.ts
   203 src/routes/app/flags/+page.server.ts
   186 src/routes/app/systems/+page.server.ts
   173 src/routes/app/roles/+page.svelte
   166 src/routes/app/workspace/+page.svelte
   146 src/routes/app/roles/+page.server.ts
   131 src/routes/app/processes/+page.svelte
    68 src/routes/app/flags/+page.svelte
```

### Shared Module Line Counts (`src/lib/server/app/**/*`)

```text
 2441 total
  681 src/lib/server/app/actions/shared.ts
  493 src/lib/server/app/actions/shared.test.ts
  353 src/lib/server/app/mappers/search.ts
  218 src/lib/server/app/mappers/search.test.ts
  177 src/lib/server/app/mappers/flags.ts
  160 src/lib/server/app/mappers/detail-relations.ts
  159 src/lib/server/app/mappers/processes.ts
   71 src/lib/server/app/mappers/flags.test.ts
   54 src/lib/server/app/mappers/directory.ts
   38 src/lib/server/app/mappers/portals.test.ts
   35 src/lib/server/app/mappers/portals.ts
    2 src/lib/server/app/actions/index.ts
```

### Component Line Counts (`src/lib/components/*.svelte`)

```text
 1971 total
  235 src/lib/components/AppSearchOverlay.svelte
  223 src/lib/components/ScShell.svelte
  189 src/lib/components/ProcessActionsSection.svelte
  176 src/lib/components/RichTextEditor.svelte
  149 src/lib/components/InlineEntityFlagControl.svelte
  140 src/lib/components/ActionEditorModal.svelte
  112 src/lib/components/ProcessCardList.svelte
   98 src/lib/components/ProcessOverviewCard.svelte
   91 src/lib/components/InlineCreateSystemModal.svelte
   85 src/lib/components/ScModal.svelte
   80 src/lib/components/CreateProcessModal.svelte
   67 src/lib/components/InlineCreateRoleModal.svelte
   57 src/lib/components/FlagsCardList.svelte
   53 src/lib/components/FlagSidebar.svelte
   52 src/lib/components/FlagsCreateForm.svelte
   50 src/lib/components/ProcessTraverseCard.svelte
   39 src/lib/components/SystemPortal.svelte
   35 src/lib/components/RolePortal.svelte
   32 src/lib/components/ProcessPortal.svelte
    8 src/lib/components/RichText.svelte
```

## Snapshot: 2026-02-14T09:10:22-05:00 (post EPI-30)

Git:

- Commit: `30765ca` (EPI-30)

Totals vs CLEANUP-00 baseline (`plans/CLEANUP_BASELINE_2026-02.md`):

- App route files total lines: **5101** (baseline 5521, delta -420)
- `src/lib/server/app/**/*` total lines: **2960** (baseline 2194, delta +766)
- `src/lib/components/*.svelte` total lines: **1971** (baseline 1971, delta 0)

Highlights:

- `src/routes/app/processes/[slug]/+page.server.ts`: 777 -> 436 (delta -341)
- `src/routes/app/processes/+page.server.ts`: 246 -> 205 (delta -41)

### App Route Line Counts

```text
  5101 total
   722 src/routes/app/team/+page.server.ts
   502 src/routes/app/processes/[slug]/+page.svelte
   436 src/routes/app/processes/[slug]/+page.server.ts
   427 src/routes/app/systems/[slug]/+page.svelte
   382 src/routes/app/team/+page.svelte
   367 src/routes/app/roles/[slug]/+page.svelte
   264 src/routes/app/systems/+page.svelte
   252 src/routes/app/systems/[slug]/+page.server.ts
   250 src/routes/app/roles/[slug]/+page.server.ts
   221 src/routes/app/workspace/+page.server.ts
   205 src/routes/app/processes/+page.server.ts
   203 src/routes/app/flags/+page.server.ts
   186 src/routes/app/systems/+page.server.ts
   173 src/routes/app/roles/+page.svelte
   166 src/routes/app/workspace/+page.svelte
   146 src/routes/app/roles/+page.server.ts
   131 src/routes/app/processes/+page.svelte
    68 src/routes/app/flags/+page.svelte
```

### Shared Module Line Counts (`src/lib/server/app/**/*`)

```text
 2960 total
 1200 src/lib/server/app/actions/shared.ts
  493 src/lib/server/app/actions/shared.test.ts
  353 src/lib/server/app/mappers/search.ts
  218 src/lib/server/app/mappers/search.test.ts
  177 src/lib/server/app/mappers/flags.ts
  160 src/lib/server/app/mappers/detail-relations.ts
  159 src/lib/server/app/mappers/processes.ts
   71 src/lib/server/app/mappers/flags.test.ts
   54 src/lib/server/app/mappers/directory.ts
   38 src/lib/server/app/mappers/portals.test.ts
   35 src/lib/server/app/mappers/portals.ts
    2 src/lib/server/app/actions/index.ts
```

### Component Line Counts (`src/lib/components/*.svelte`)

```text
 1971 total
  235 src/lib/components/AppSearchOverlay.svelte
  223 src/lib/components/ScShell.svelte
  189 src/lib/components/ProcessActionsSection.svelte
  176 src/lib/components/RichTextEditor.svelte
  149 src/lib/components/InlineEntityFlagControl.svelte
  140 src/lib/components/ActionEditorModal.svelte
  112 src/lib/components/ProcessCardList.svelte
   98 src/lib/components/ProcessOverviewCard.svelte
   91 src/lib/components/InlineCreateSystemModal.svelte
   85 src/lib/components/ScModal.svelte
   80 src/lib/components/CreateProcessModal.svelte
   67 src/lib/components/InlineCreateRoleModal.svelte
   57 src/lib/components/FlagsCardList.svelte
   53 src/lib/components/FlagSidebar.svelte
   52 src/lib/components/FlagsCreateForm.svelte
   50 src/lib/components/ProcessTraverseCard.svelte
   39 src/lib/components/SystemPortal.svelte
   35 src/lib/components/RolePortal.svelte
   32 src/lib/components/ProcessPortal.svelte
    8 src/lib/components/RichText.svelte
```

## Snapshot: 2026-02-14T09:20:34-05:00 (post EPI-32)

Git:

- Commit: `bfcc10d` (EPI-32)

Totals vs CLEANUP-00 baseline (`plans/CLEANUP_BASELINE_2026-02.md`):

- App route files total lines: **4926** (baseline 5521, delta -595)
- `src/lib/server/app/**/*` total lines: **3032** (baseline 2194, delta +838)
- `src/lib/components/*.svelte` total lines: **1971** (baseline 1971, delta 0)

Highlights:

- `src/routes/app/processes/[slug]/+page.server.ts`: 777 -> 390 (delta -387)
- `src/routes/app/processes/+page.server.ts`: 246 -> 176 (delta -70)
- `src/routes/app/flags/+page.server.ts`: 241 -> 187 (delta -54)

### App Route Line Counts

```text
  4926 total
   722 src/routes/app/team/+page.server.ts
   502 src/routes/app/processes/[slug]/+page.svelte
   427 src/routes/app/systems/[slug]/+page.svelte
   390 src/routes/app/processes/[slug]/+page.server.ts
   382 src/routes/app/team/+page.svelte
   367 src/routes/app/roles/[slug]/+page.svelte
   264 src/routes/app/systems/+page.svelte
   233 src/routes/app/systems/[slug]/+page.server.ts
   231 src/routes/app/roles/[slug]/+page.server.ts
   221 src/routes/app/workspace/+page.server.ts
   187 src/routes/app/flags/+page.server.ts
   176 src/routes/app/processes/+page.server.ts
   173 src/routes/app/roles/+page.svelte
   166 src/routes/app/workspace/+page.svelte
   156 src/routes/app/systems/+page.server.ts
   131 src/routes/app/processes/+page.svelte
   130 src/routes/app/roles/+page.server.ts
    68 src/routes/app/flags/+page.svelte
```

### Shared Module Line Counts (`src/lib/server/app/**/*`)

```text
 3032 total
 1200 src/lib/server/app/actions/shared.ts
  493 src/lib/server/app/actions/shared.test.ts
  353 src/lib/server/app/mappers/search.ts
  218 src/lib/server/app/mappers/search.test.ts
  177 src/lib/server/app/mappers/flags.ts
  160 src/lib/server/app/mappers/detail-relations.ts
  159 src/lib/server/app/mappers/processes.ts
   72 src/lib/server/app/actions/wrapAction.ts
   71 src/lib/server/app/mappers/flags.test.ts
   54 src/lib/server/app/mappers/directory.ts
   38 src/lib/server/app/mappers/portals.test.ts
   35 src/lib/server/app/mappers/portals.ts
    2 src/lib/server/app/actions/index.ts
```
