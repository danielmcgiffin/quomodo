import { test, expect } from "@playwright/test"
import { signInViaEmailPassword } from "./helpers/auth"

const email = process.env.E2E_EMAIL ?? ""
const password = process.env.E2E_PASSWORD ?? ""

test.describe("crud happy path", () => {
  test("create role, system, process", async ({ page }) => {
    test.skip(
      !email || !password,
      "Set E2E_EMAIL and E2E_PASSWORD to run authenticated E2E tests.",
    )

    const runId = String(Date.now())
    const roleName = `E2E Role ${runId}`
    const systemName = `E2E System ${runId}`
    const processName = `E2E Process ${runId}`

    await signInViaEmailPassword(page, { email, password })
    await page.waitForURL(/\/app\//, { timeout: 15_000 })

    // Role
    await page.goto("/app/roles")
    await page.getByRole("button", { name: /make a role/i }).click()
    await page.getByPlaceholder("Role name").fill(roleName)
    await page.getByRole("button", { name: "Create Role", exact: true }).click()
    try {
      await page.waitForURL(/\/app\/roles\/[^/]+/, { timeout: 30_000 })
    } catch {
      const errorText = await page
        .locator(".sc-form-error, [role='alert'], .alert")
        .first()
        .innerText()
        .catch(() => "")
      throw new Error(
        `Expected role creation to redirect to /app/roles/[slug] but stayed on ${page.url()}.` +
          (errorText ? ` Error message: ${errorText}` : ""),
      )
    }
    await expect(page.locator("body")).toContainText(roleName)

    // System
    await page.goto("/app/systems")
    await page.getByRole("button", { name: /record a system/i }).click()
    await page.getByPlaceholder("System name").fill(systemName)
    await page.getByPlaceholder(/location/i).fill(`E2E ${runId}`)
    await page
      .getByRole("button", { name: "Create System", exact: true })
      .click()
    try {
      await page.waitForURL(/\/app\/systems\/[^/]+/, { timeout: 30_000 })
    } catch {
      const errorText = await page
        .locator(".sc-form-error, [role='alert'], .alert")
        .first()
        .innerText()
        .catch(() => "")
      throw new Error(
        `Expected system creation to redirect to /app/systems/[slug] but stayed on ${page.url()}.` +
          (errorText ? ` Error message: ${errorText}` : ""),
      )
    }
    await expect(page.locator("body")).toContainText(systemName)

    // Process
    await page.goto("/app/processes")
    await page.getByRole("button", { name: /write a process/i }).click()
    await page.getByPlaceholder("Process name").fill(processName)
    await page.getByPlaceholder(/trigger/i).fill(`Trigger for ${runId}`)
    await page.getByPlaceholder(/outcome/i).fill(`Outcome for ${runId}`)
    await page
      .getByRole("button", { name: "Create Process", exact: true })
      .click()
    try {
      await page.waitForURL(/\/app\/processes\/[^/]+/, { timeout: 30_000 })
    } catch {
      const errorText = await page
        .locator(".sc-form-error, [role='alert'], .alert")
        .first()
        .innerText()
        .catch(() => "")
      throw new Error(
        `Expected process creation to redirect to /app/processes/[slug] but stayed on ${page.url()}.` +
          (errorText ? ` Error message: ${errorText}` : ""),
      )
    }
    await expect(page.locator("body")).toContainText(processName)
  })
})
