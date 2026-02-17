<script lang="ts">
  import { pricingPlans } from "./pricing_plans"

  interface Props {
    // Module context
    highlightedPlanId?: string
    callToAction: string
    currentPlanId?: string
    center?: boolean
  }

  let {
    highlightedPlanId = "",
    callToAction,
    currentPlanId = "",
    center = true,
  }: Props = $props()
</script>

<div
  class="flex flex-col lg:flex-row gap-8 {center
    ? 'place-content-center'
    : ''} flex-wrap"
>
  {#each pricingPlans as plan}
    <div
      class="flex-none card bg-[#141416] border {plan.id === highlightedPlanId
        ? 'border-primary/50 ring-1 ring-primary/20'
        : 'border-white/5'} shadow-2xl flex-1 grow min-w-[280px] max-w-[340px] p-8 transition-all hover:border-primary/30"
    >
      <div class="flex flex-col h-full">
        <div class="text-2xl font-bold text-white">{plan.name}</div>
        <p class="mt-3 text-slate-400 leading-relaxed min-h-[3rem]">
          {plan.description}
        </p>

        <div class="mt-8 mb-8">
          <span class="text-5xl font-bold text-white">{plan.price}</span>
          {#if plan.price !== "Custom"}
            <span class="text-slate-500 ml-1">{plan.priceIntervalName}</span>
          {/if}
        </div>

        <div class="mt-auto pt-6 border-t border-white/5">
          <div
            class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4"
          >
            Included Features
          </div>
          <ul class="space-y-3">
            {#each plan.features as feature}
              <li class="flex items-start gap-3 text-slate-400 text-sm">
                <svg
                  class="w-5 h-5 text-primary flex-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            {/each}
          </ul>
        </div>

        <div class="pt-10">
          <div class="flex flex-row items-center">
            {#if plan.id === currentPlanId}
              <div
                class="btn btn-outline btn-success no-animation w-full cursor-default"
              >
                Current Plan
              </div>
            {:else}
              <a
                href={"/account/subscribe/" +
                  (plan?.stripe_price_id ?? "free_plan")}
                class="btn btn-primary w-full"
              >
                {callToAction}
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>
