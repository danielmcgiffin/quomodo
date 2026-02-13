import { redirect } from "@sveltejs/kit"
import { ensureOrgContext } from "$lib/server/atlas"
import { getOrgBillingSnapshot } from "$lib/server/billing"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
}) => {
  const { session } = await locals.safeGetSession()
  if (!session || !locals.user?.id) {
    redirect(303, "/login")
  }

  const context = await ensureOrgContext(locals)
  const billing = await getOrgBillingSnapshot(locals, context.orgId)

  return {
    org: context,
    billing,
    canManageBilling: context.membershipRole === "owner",
    // Compatibility with existing UI semantics.
    isActiveCustomer: billing.planId !== "free" && !billing.isLapsed,
    hasEverHadSubscription: billing.hasEverPaid,
    currentPlanId: billing.planId,
  }
}
