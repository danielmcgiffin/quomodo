import { env as privateEnv } from "$env/dynamic/private"
import { error, redirect } from "@sveltejs/kit"
import Stripe from "stripe"
import { WebsiteBaseUrl } from "../../../../../config"
import { ensureOrgContext } from "$lib/server/atlas"
import {
  getOrCreateOrgCustomerId,
  getOrgBillingSnapshot,
} from "$lib/server/billing"
import type { PageServerLoad } from "./$types"
const stripe = new Stripe(privateEnv.PRIVATE_STRIPE_API_KEY, {
  apiVersion: "2023-08-16",
})

export const load: PageServerLoad = async ({ params, locals }) => {
  const { session } = await locals.safeGetSession()
  if (!session) {
    redirect(303, "/login")
  }

  if (params.slug === "free_plan") {
    // plan with no stripe_price_id. Redirect to account home
    redirect(303, "/account")
  }

  const context = await ensureOrgContext(locals)
  if (context.membershipRole !== "owner") {
    error(403, {
      message: "Only the workspace owner can reactivate or change billing.",
    })
  }

  const currentBilling = await getOrgBillingSnapshot(locals, context.orgId)
  if (currentBilling.planId !== "free" && !currentBilling.isLapsed) {
    // Workspace already has an active paid plan.
    redirect(303, "/account/billing")
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
      message: "Unknown error. If issue persists, please contact us.",
    })
  }

  let checkoutUrl
  try {
    const successUrl = new URL("/account", WebsiteBaseUrl).toString()
    const cancelUrl = new URL("/account/billing", WebsiteBaseUrl).toString()
    const stripeSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: params.slug,
          quantity: 1,
        },
      ],
      customer: customerResult.customerId,
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
    checkoutUrl = stripeSession.url
  } catch (e) {
    console.error("Error creating checkout session", e)
    error(500, "Unknown Error (SSE): If issue persists please contact us.")
  }

  redirect(303, checkoutUrl ?? "/pricing")
}
