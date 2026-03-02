<script lang="ts">
  import { marketingSite } from "$lib/marketing/site"
  import { Check } from "lucide-svelte"

  interface Props {
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
    <article
      class="mk-pricing-card"
      class:featured={plan.featured || plan.id === highlightedPlanId}
    >
      {#if plan.badge}
        <span class="mk-pricing-badge">{plan.badge}</span>
      {/if}

      <header class="mk-pricing-header">
        <p class="mk-plan-name">{plan.name}</p>
        <p class="mk-plan-price">
          {plan.price}{#if plan.price !== "Custom"}<small>/mo</small>{/if}
        </p>
      </header>

      <p class="mk-plan-desc">{plan.desc}</p>

      <ul class="mk-plan-perks">
        {#each plan.perks as perk}
          <li>
            <Check size={14} />
            <span>{perk}</span>
          </li>
        {/each}
      </ul>

      <div class="mt-auto pt-4">
        {#if plan.id === currentPlanId}
          <div class="mk-btn mk-btn-quiet mk-btn-disabled w-full">
            Current plan
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
    </article>
  {/each}
</div>
