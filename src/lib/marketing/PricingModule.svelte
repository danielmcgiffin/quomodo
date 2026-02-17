<script lang="ts">
  import { marketingSite } from "$lib/marketing/site"
  import { Check } from "lucide-svelte"

  interface Props {
    // Module context
    highlightedPlanId?: string
    callToAction?: string
    currentPlanId?: string
    center?: boolean
    useStripeLinks?: boolean
  }

  let {
    highlightedPlanId = "growth",
    callToAction,
    currentPlanId = "",
    center = true,
    useStripeLinks = true,
  }: Props = $props()
</script>

<div class="mk-pricing-grid" style={center ? "" : "justify-content: start;"}>
  {#each marketingSite.pricing.plans as plan}
    <div
      class="mk-pricing-card"
      class:featured={plan.featured || plan.id === highlightedPlanId}
    >
      {#if plan.badge}
        <div class="mk-pricing-badge">{plan.badge}</div>
      {/if}
      <div class="mk-pricing-header">
        <div class="mk-plan-name">{plan.name}</div>
        <div class="mk-plan-price">
          {plan.price}{#if plan.price !== "Custom"}<small>/mo</small>{/if}
        </div>
      </div>
      <p class="mk-plan-desc">{plan.desc}</p>

      <ul class="mk-plan-perks">
        {#each plan.perks as perk}
          <li><Check size={14} /> {perk}</li>
        {/each}
      </ul>

      <div class="mt-auto pt-4">
        {#if plan.id === currentPlanId}
          <div class="mk-btn mk-btn-quiet w-full cursor-default opacity-60">
            Current Plan
          </div>
        {:else}
          <a
            href={useStripeLinks && plan.stripe_price_id
              ? "/account/subscribe/" + plan.stripe_price_id
              : plan.cta.href}
            class="mk-btn mk-btn-primary w-full"
          >
            {callToAction || plan.cta.label}
          </a>
        {/if}
      </div>
    </div>
  {/each}
</div>
