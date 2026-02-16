import { throwRuntime500 } from "$lib/server/runtime-errors"
import { ensureOrgContext } from "$lib/server/atlas"

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  
  throwRuntime500({
    context: "TEST_ERROR_SR19",
    error: new Error("This is a manual test error for SR-19 reporting logic."),
    requestId: locals.requestId,
    userId: context.userId,
    route: "/app/test-error",
    details: {
      test: true,
      timestamp: new Date().toISOString()
    }
  })
}
