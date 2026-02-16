import type { Page } from "@playwright/test"

export async function signInViaEmailPassword(
  page: Page,
  opts: { email: string; password: string },
) {
  await page.goto("/login/sign_in?next=%2Fapp%2Fprocesses")

  // Supabase Auth UI uses standard labels.
  await page.getByLabel(/email/i).fill(opts.email)
  await page.getByLabel(/password/i).fill(opts.password)

  // Avoid strict-mode ambiguity with "Sign in with Github".
  await page.getByRole("button", { name: "Sign in", exact: true }).click()

  // Either we redirect into /app/* or we stay on sign-in with an error message.
  // Keep this helper responsible for diagnosing auth failures.
  try {
    await page.waitForURL(/\/app\//, { timeout: 15_000 })
  } catch {
    const errorText = await page
      .locator(".supabase-auth-ui_ui-message, [role='alert'], .alert")
      .first()
      .innerText()
      .catch(() => "")

    throw new Error(
      `Expected sign-in to redirect into /app/* but stayed on ${page.url()}.` +
        (errorText ? ` Error message: ${errorText}` : ""),
    )
  }
}
