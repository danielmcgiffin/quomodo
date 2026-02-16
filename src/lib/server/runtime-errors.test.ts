import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logRuntimeError } from "./runtime-errors"
import { sendAdminEmail } from "$lib/mailer"

// Mock sendAdminEmail
vi.mock("$lib/mailer", () => ({
  sendAdminEmail: vi.fn().mockResolvedValue({}),
}))

describe("logRuntimeError", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("sends an email for the first unique error", async () => {
    logRuntimeError({
      context: "test-context",
      error: new Error("Unique Error 1"),
      route: "/test-route",
    })

    expect(sendAdminEmail).toHaveBeenCalledTimes(1)
    expect(sendAdminEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("500 ERROR: test-context"),
        body: expect.stringContaining("Unique Error 1"),
      }),
    )
  })

  it("rate limits identical errors within 5 minutes", async () => {
    const errorArgs = {
      context: "rate-limit-test",
      error: new Error("Repeated Error"),
      route: "/repeated-route",
    }

    // First call - should send
    logRuntimeError(errorArgs)
    expect(sendAdminEmail).toHaveBeenCalledTimes(1)

    // Second call - should NOT send (rate limited)
    logRuntimeError(errorArgs)
    expect(sendAdminEmail).toHaveBeenCalledTimes(1)

    // Advance time by 5 minutes and 1 second
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000)

    // Third call - should send again
    logRuntimeError(errorArgs)
    expect(sendAdminEmail).toHaveBeenCalledTimes(2)
  })

  it("does not rate limit different errors", async () => {
    logRuntimeError({
      context: "context-a",
      error: new Error("Error A"),
      route: "/route-a",
    })
    expect(sendAdminEmail).toHaveBeenCalledTimes(1)

    logRuntimeError({
      context: "context-b",
      error: new Error("Error B"),
      route: "/route-b",
    })
    expect(sendAdminEmail).toHaveBeenCalledTimes(2)
  })
})
