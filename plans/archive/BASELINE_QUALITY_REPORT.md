# Baseline Quality Gate Report

Captured: 2026-02-14T06:37:37-05:00

## Commands + Raw Outputs

- `npm run check` -> `baseline-check.txt`
- `npm run lint` -> `baseline-lint.txt`
- `npm run build` -> `baseline-build.txt`

## Summary

- Check: PASS (0 errors, 0 warnings)
- Lint: PASS (0 errors reported)
- Build: FAIL (`listen EPERM: operation not permitted 127.0.0.1`)

## App-Specific Error Inventory (From `npm run check`)

Scope filter:

- `src/routes/app/*`
- `src/lib/components/*`
- `src/lib/server/atlas.ts`

App-specific error count: **0**

No app-specific errors reported by `svelte-check` in this baseline capture.
