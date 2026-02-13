import { env as privateEnv } from "$env/dynamic/private"
import { error as kitError } from "@sveltejs/kit"
import Stripe from "stripe"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { Database } from "../../DatabaseDefinitions"
import { pricingPlans, defaultPlanId } from "../../routes/(marketing)/pricing/pricing_plans"
import { throwRuntime500 } from "$lib/server/runtime-errors"

const stripe = new Stripe(privateEnv.PRIVATE_STRIPE_API_KEY, {
  apiVersion: "2023-08-16",
})

export type BillingState = "active" | "lapsed"

export type OrgBillingSnapshot = {
  orgId: string
  planId: string
  billingState: BillingState
  isLapsed: boolean
  hasEverPaid: boolean
  stripeCustomerId: string | null
  lastCheckedAt: string | null
}

const BILLING_REFRESH_TTL_MS = 5 * 60 * 1000

const mapStripeSubscriptionToPlanId = (
  subscription: Stripe.Subscription,
): string | null => {
  const primaryPrice = subscription.items?.data?.[0]?.price
  const productId = String(primaryPrice?.product ?? "")
  const priceId = String(primaryPrice?.id ?? "")

  const mapped = pricingPlans.find((plan) => {
    if (!plan.stripe_product_id && !plan.stripe_price_id) {
      return false
    }
    return plan.stripe_product_id === productId || plan.stripe_price_id === priceId
  })

  return mapped?.id ?? null
}

const computeBillingSnapshotFromStripe = ({
  orgId,
  stripeCustomerId,
  stripeSubscriptions,
}: {
  orgId: string
  stripeCustomerId: string
  stripeSubscriptions: Stripe.Response<Stripe.ApiList<Stripe.Subscription>>
}): Pick<
  OrgBillingSnapshot,
  "planId" | "billingState" | "isLapsed" | "hasEverPaid" | "stripeCustomerId"
> => {
  const primary = stripeSubscriptions.data.find((candidate) => {
    return (
      candidate.status === "active" ||
      candidate.status === "trialing" ||
      candidate.status === "past_due"
    )
  })

  if (primary) {
    const mappedPlanId = mapStripeSubscriptionToPlanId(primary)
    if (!mappedPlanId) {
      throw new Error(
        `Stripe subscription could not be mapped to pricing_plans.ts (org=${orgId})`,
      )
    }
    return {
      stripeCustomerId,
      planId: mappedPlanId,
      billingState: "active",
      isLapsed: false,
      hasEverPaid: true,
    }
  }

  const hasEverPaid = stripeSubscriptions.data.length > 0
  if (hasEverPaid) {
    return {
      stripeCustomerId,
      planId: defaultPlanId,
      billingState: "lapsed",
      isLapsed: true,
      hasEverPaid: true,
    }
  }

  return {
    stripeCustomerId,
    planId: defaultPlanId,
    billingState: "active",
    isLapsed: false,
    hasEverPaid: false,
  }
}

export const getOrCreateOrgCustomerId = async ({
  supabaseServiceRole,
  orgId,
  ownerUser,
}: {
  supabaseServiceRole: SupabaseClient<Database>
  orgId: string
  ownerUser: Pick<User, "id" | "email">
}): Promise<{ customerId: string } | { error: unknown }> => {
  const existing = await supabaseServiceRole
    .from("org_billing")
    .select("stripe_customer_id")
    .eq("org_id", orgId)
    .maybeSingle()

  if (existing.error) {
    return { error: existing.error }
  }
  if (existing.data?.stripe_customer_id) {
    return { customerId: existing.data.stripe_customer_id }
  }

  const orgResult = await supabaseServiceRole
    .from("orgs")
    .select("name")
    .eq("id", orgId)
    .maybeSingle()

  if (orgResult.error) {
    return { error: orgResult.error }
  }

  let customer: Stripe.Customer
  try {
    customer = await stripe.customers.create({
      email: ownerUser.email ?? undefined,
      name: orgResult.data?.name ?? "SystemsCraft Workspace",
      metadata: {
        org_id: orgId,
        owner_user_id: ownerUser.id,
      },
    })
  } catch (e) {
    return { error: e }
  }

  if (!customer.id) {
    return { error: new Error("Stripe customer creation failed.") }
  }

  const upsertResult = await supabaseServiceRole.from("org_billing").upsert(
    {
      org_id: orgId,
      stripe_customer_id: customer.id,
      plan_id: defaultPlanId,
      billing_state: "active",
      has_ever_paid: false,
      last_checked_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  )

  if (upsertResult.error) {
    return { error: upsertResult.error }
  }

  return { customerId: customer.id }
}

export const getOrgBillingSnapshot = async (
  locals: App.Locals,
  orgId: string,
): Promise<OrgBillingSnapshot> => {
  const supabaseServiceRole = locals.supabaseServiceRole

  const rowResult = await supabaseServiceRole
    .from("org_billing")
    .select(
      "org_id, stripe_customer_id, plan_id, billing_state, has_ever_paid, last_checked_at",
    )
    .eq("org_id", orgId)
    .maybeSingle()

  if (rowResult.error) {
    throwRuntime500({
      context: "billing.orgBilling.lookup",
      error: rowResult.error,
      requestId: locals.requestId,
      details: { orgId },
    })
  }

  const row = rowResult.data
  const stripeCustomerId = row?.stripe_customer_id ?? null
  const lastCheckedAt = row?.last_checked_at ?? null

  // No Stripe linkage: treat as free+active workspace.
  if (!stripeCustomerId) {
    return {
      orgId,
      stripeCustomerId: null,
      planId: row?.plan_id ?? defaultPlanId,
      billingState: (row?.billing_state as BillingState | undefined) ?? "active",
      isLapsed: row?.billing_state === "lapsed",
      hasEverPaid: row?.has_ever_paid ?? false,
      lastCheckedAt,
    }
  }

  const lastCheckedMs = lastCheckedAt ? Date.parse(lastCheckedAt) : 0
  const nowMs = Date.now()
  const shouldRefresh = !lastCheckedMs || nowMs - lastCheckedMs > BILLING_REFRESH_TTL_MS

  if (!shouldRefresh && row) {
    return {
      orgId,
      stripeCustomerId,
      planId: row.plan_id ?? defaultPlanId,
      billingState: row.billing_state as BillingState,
      isLapsed: row.billing_state === "lapsed",
      hasEverPaid: row.has_ever_paid ?? false,
      lastCheckedAt,
    }
  }

  const stripeSubscriptions = await stripe.subscriptions
    .list({
      customer: stripeCustomerId,
      limit: 100,
      status: "all",
    })
    .catch((e) => {
      return throwRuntime500({
        context: "billing.stripe.subscriptionList",
        error: e,
        requestId: locals.requestId,
        details: { orgId, stripeCustomerId },
      })
    })

  let computed: ReturnType<typeof computeBillingSnapshotFromStripe> | undefined
  try {
    computed = computeBillingSnapshotFromStripe({
      orgId,
      stripeCustomerId,
      stripeSubscriptions,
    })
  } catch (e) {
    throwRuntime500({
      context: "billing.stripe.subscriptionMap",
      error: e,
      requestId: locals.requestId,
      details: { orgId, stripeCustomerId },
    })
  }

  if (!computed) {
    throwRuntime500({
      context: "billing.stripe.subscriptionMap.unreachable",
      error: new Error("Billing snapshot computation unexpectedly returned null."),
      requestId: locals.requestId,
      details: { orgId, stripeCustomerId },
    })
  }

  const computedSnapshot = computed!

  const nowIso = new Date().toISOString()
  const upsertResult = await supabaseServiceRole.from("org_billing").upsert(
    {
      org_id: orgId,
      stripe_customer_id: stripeCustomerId,
      plan_id: computedSnapshot.planId,
      billing_state: computedSnapshot.billingState,
      has_ever_paid: computedSnapshot.hasEverPaid,
      last_checked_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "org_id" },
  )

  if (upsertResult.error) {
    throwRuntime500({
      context: "billing.orgBilling.upsert",
      error: upsertResult.error,
      requestId: locals.requestId,
      details: { orgId },
    })
  }

  return {
    orgId,
    stripeCustomerId,
    planId: computedSnapshot.planId,
    billingState: computedSnapshot.billingState,
    isLapsed: computedSnapshot.isLapsed,
    hasEverPaid: computedSnapshot.hasEverPaid,
    lastCheckedAt: nowIso,
  }
}

export const assertWorkspaceWritable = (billing: OrgBillingSnapshot): void => {
  if (billing.isLapsed) {
    throw kitError(
      403,
      "This workspace is in read-only mode because billing has lapsed. The workspace owner must reactivate billing to make changes.",
    )
  }
}
