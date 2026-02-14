import type { Page } from "@playwright/test"

export async function signInViaEmailPassword(page: Page, opts: { email: string; password: string }) {
  await page.goto("/login/sign_in?next=%2Fapp%2Fprocesses")

  // Supabase Auth UI uses standard labels.
  await page.getByLabel(/email/i).fill(opts.email)
  await page.getByLabel(/password/i).fill(opts.password)

  await page.getByRole("button", { name: /sign in/i }).click()
}

