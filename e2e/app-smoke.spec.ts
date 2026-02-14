import { test, expect } from "@playwright/test"
import { signInViaEmailPassword } from "./helpers/auth"

const email = process.env.E2E_EMAIL ?? ""
const password = process.env.E2E_PASSWORD ?? ""

test.describe("app smoke", () => {
  test("sign in and load core app pages", async ({ page }) => {
    test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.")

    await signInViaEmailPassword(page, { email, password })

    await expect(page).toHaveURL(/\/app\/processes/)
    await expect(page.locator(".sc-shell")).toBeVisible()
    await expect(page.locator(".sc-sidebar")).toBeVisible()

    await page.goto("/app/roles")
    await expect(page.locator(".sc-shell")).toBeVisible()

    await page.goto("/app/systems")
    await expect(page.locator(".sc-shell")).toBeVisible()

    await page.goto("/app/processes")
    await expect(page.locator(".sc-shell")).toBeVisible()

    await page.goto("/app/flags")
    await expect(page.locator(".sc-shell")).toBeVisible()

    await page.goto("/app/workspace")
    await expect(page.locator(".sc-shell")).toBeVisible()

    // Team page may be admin-only; still useful to smoke if accessible.
    await page.goto("/app/team")
    await expect(page.locator("body")).toBeVisible()
  })
})
