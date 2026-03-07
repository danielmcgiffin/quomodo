export const getRequiredE2ECredentials = () => {
  const email = process.env.E2E_EMAIL?.trim() ?? ""
  const password = process.env.E2E_PASSWORD ?? ""

  if (!email || !password) {
    throw new Error(
      [
        "Missing E2E auth credentials.",
        "Set E2E_EMAIL and E2E_PASSWORD before running authenticated Playwright specs.",
        "For CI, add both as GitHub repository secrets.",
      ].join(" "),
    )
  }

  return { email, password }
}
