# CLEANUP-00 Baseline Metrics (2026-02)

Captured: 2026-02-14T07:20:41-05:00

## Quality Gates

### `npm run check`

Result: PASS (0 errors, 0 warnings)

```text
npm warn Unknown project config "resolution-mode". This will stop working in the next major version of npm.

> cmsassstarter@0.0.1 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json

Loading svelte-check in workspace: /home/epicus/code/quomodo
Getting Svelte diagnostics...

svelte-check found 0 errors and 0 warnings
```

### `npm run lint`

Result: PASS

```text
npm warn Unknown project config "resolution-mode". This will stop working in the next major version of npm.

> cmsassstarter@0.0.1 lint
> eslint .
```

### `npm run build`

Result: PASS

Notes:

- Build logs include `> Using @sveltejs/adapter-auto` because local/sandbox builds cannot bind `127.0.0.1` (required by Miniflare when using `adapter-cloudflare`).

```text
npm warn Unknown project config "resolution-mode". This will stop working in the next major version of npm.

> cmsassstarter@0.0.1 build
> vite build

vite v7.3.1 building ssr environment for production...
transforming...
/*! 🌼 daisyUI 5.0.0 */
✓ 365 modules transformed.
rendering chunks...
vite v7.3.1 building client environment for production...
transforming...
✓ 428 modules transformed.
rendering chunks...
computing gzip size...
Building search index...
Search index built
...
✓ built in 10.25s

Run npm run preview to preview your production build locally.

> Using @sveltejs/adapter-auto
  Could not detect a supported production environment. See https://svelte.dev/docs/kit/adapters to learn how to configure your app to run on the platform of your choosing
  ✔ done
```

## App Route Line Counts

Command:

```bash
wc -l src/routes/app/**/*.server.ts src/routes/app/**/**/*.server.ts src/routes/app/**/*.svelte src/routes/app/**/**/*.svelte | sort -rn
```

Output:

```text
  5521 total
   777 src/routes/app/processes/[slug]/+page.server.ts
   722 src/routes/app/team/+page.server.ts
   502 src/routes/app/processes/[slug]/+page.svelte
   427 src/routes/app/systems/[slug]/+page.svelte
   382 src/routes/app/team/+page.svelte
   367 src/routes/app/roles/[slug]/+page.svelte
   264 src/routes/app/systems/+page.svelte
   252 src/routes/app/systems/[slug]/+page.server.ts
   250 src/routes/app/roles/[slug]/+page.server.ts
   246 src/routes/app/processes/+page.server.ts
   241 src/routes/app/flags/+page.server.ts
   221 src/routes/app/workspace/+page.server.ts
   186 src/routes/app/systems/+page.server.ts
   173 src/routes/app/roles/+page.svelte
   166 src/routes/app/workspace/+page.svelte
   146 src/routes/app/roles/+page.server.ts
   131 src/routes/app/processes/+page.svelte
    68 src/routes/app/flags/+page.svelte
```

## Shared Module Line Counts (`src/lib/server/app/**/*`)

Command:

```bash
wc -l src/lib/server/app/**/* | sort -rn
```

Output:

```text
 2194 total
  493 src/lib/server/app/actions/shared.test.ts
  436 src/lib/server/app/actions/shared.ts
  353 src/lib/server/app/mappers/search.ts
  218 src/lib/server/app/mappers/search.test.ts
  177 src/lib/server/app/mappers/flags.ts
  160 src/lib/server/app/mappers/detail-relations.ts
  159 src/lib/server/app/mappers/processes.ts
   71 src/lib/server/app/mappers/flags.test.ts
   54 src/lib/server/app/mappers/directory.ts
   38 src/lib/server/app/mappers/portals.test.ts
   35 src/lib/server/app/mappers/portals.ts
```

## Component Line Counts (`src/lib/components/*.svelte`)

Command:

```bash
wc -l src/lib/components/*.svelte | sort -rn
```

Output:

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

## Test Run Baseline

Command:

```bash
npm run test_run 2>&1 | tail -5
```

Result: PASS

Summary (from `vitest run` output):

- Test Files: 10 passed (10)
- Tests: 42 passed (42)

