const parseNumber = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

export const e2eConfig = {
  // Keep names stable so the seed script and Playwright tests can find the fixture workspace.
  lapsedWorkspaceName:
    process.env.E2E_LAPSED_WORKSPACE_NAME ?? "E2E Lapsed Workspace",

  // Entitlement knobs (used for tests like SR-07; keep configurable as plans change).
  freeTierMaxUsers: parseNumber(process.env.E2E_FREE_TIER_MAX_USERS, 5),
}
