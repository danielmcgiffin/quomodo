import { test, expect } from "@playwright/test"
import { signInViaEmailPassword } from "./helpers/auth"
import { e2eConfig } from "./config"

const email = process.env.E2E_EMAIL ?? ""
const password = process.env.E2E_PASSWORD ?? ""

const LapsedMessage =
  "This workspace is in read-only mode because billing has lapsed."

test.describe("billing gate", () => {
  test("lapsed workspace is read-only and blocks invites", async ({ page }) => {
    test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.")

    await signInViaEmailPassword(page, { email, password })

    // Switch into the lapsed fixture workspace.
    await page.goto("/app/workspace")
    const membershipsSection = page
      .locator("section")
      .filter({ hasText: "Your memberships" })
      .first()
    await expect(membershipsSection).toBeVisible()

    const nameEl = membershipsSection.getByText(e2eConfig.lapsedWorkspaceName, { exact: true })
    await expect(nameEl).toBeVisible()

    const row = nameEl.locator(
      "xpath=ancestor::div[contains(concat(\" \", normalize-space(@class), \" \"), \" sc-form-row \")]",
    )
    await expect(row).toBeVisible()

    await row
      .locator('form[action="?/switchWorkspace"]')
      .first()
      .getByRole("button", { name: "Switch", exact: true })
      .click()
    await page.waitForURL(/\/app\/workspace\\?switched=1/, { timeout: 15_000 })

    // Lapsed banner appears across /app.
    await page.goto("/app/processes")
    await expect(page.locator(".sc-banner")).toContainText(LapsedMessage)

    // Attempting a write should fail with a 403 error page message.
    await page.getByRole("button", { name: /write a process/i }).click()
    await page.getByPlaceholder("Process name").fill("E2E Lapsed Process Attempt")
    await page.getByPlaceholder(/trigger/i).fill("Trigger")
    await page.getByPlaceholder(/outcome/i).fill("Outcome")
    await page.getByRole("button", { name: "Create Process", exact: true }).click()
    await expect(page.locator("body")).toContainText(LapsedMessage)

    // Invites should also be blocked while lapsed.
    await page.goto("/app/team")
    await page.getByPlaceholder("teammate@example.com").fill("e2e-invitee@example.com")
    await page.getByRole("button", { name: /send invite/i }).click()
    await expect(page.locator("body")).toContainText(LapsedMessage)
  })
})
