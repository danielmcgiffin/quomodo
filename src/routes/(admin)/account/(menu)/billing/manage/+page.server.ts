import { env as privateEnv } from "$env/dynamic/private"
import { error, redirect } from "@sveltejs/kit"
import Stripe from "stripe"
import { WebsiteBaseUrl } from "../../../../../../config"
import { ensureOrgContext } from "$lib/server/atlas"
import { getOrCreateOrgCustomerId } from "$lib/server/billing"
import type { PageServerLoad } from "./$types"
const stripe = new Stripe(privateEnv.PRIVATE_STRIPE_API_KEY, {
  apiVersion: "2023-08-16",
})

export const load: PageServerLoad = async ({
  locals,
}) => {
  const { session } = await locals.safeGetSession()
  if (!session) {
    redirect(303, "/login")
  }

  const context = await ensureOrgContext(locals)
  if (context.membershipRole !== "owner") {
    error(403, { message: "Only the workspace owner can manage billing." })
  }

  const ownerUser = locals.user
  if (!ownerUser?.id) {
    redirect(303, "/login")
  }

  const customerResult = await getOrCreateOrgCustomerId({
    supabaseServiceRole: locals.supabaseServiceRole,
    orgId: context.orgId,
    ownerUser,
  })

  if ("error" in customerResult) {
    console.error("Error creating org customer id", customerResult.error)
    error(500, {
      message: "Unknown error (PCID). If issue persists, please contact us.",
    })
  }

  let portalLink
  try {
    const returnUrl = new URL("/account/billing", WebsiteBaseUrl).toString()
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerResult.customerId,
      return_url: returnUrl,
    })
    portalLink = portalSession?.url
  } catch (e) {
    console.error("Error creating billing portal session", e)
    error(500, "Unknown error (PSE). If issue persists, please contact us.")
  }

  redirect(303, portalLink ?? "/account/billing")
}
