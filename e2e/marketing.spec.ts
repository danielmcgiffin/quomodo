import { test, expect } from "@playwright/test"

test("marketing pages load", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/SystemsCraft/i)

  await page.goto("/pricing")
  await expect(page.locator("main")).toContainText(/Basic|Growth/i)

  await page.goto("/method")
  await expect(page.locator("main")).toBeVisible()

  await page.goto("/contact")
  await expect(page.locator("main")).toBeVisible()

  await page.goto("/login/sign_in")
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()

  await page.goto("/login/sign_up")
  await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible()
})
