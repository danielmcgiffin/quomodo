<script lang="ts">
  import PricingModule from "$lib/marketing/PricingModule.svelte"
  import { marketingSite } from "$lib/marketing/site"
  import { ChevronRight } from "lucide-svelte"
</script>

<svelte:head>
  <title>Pricing | {marketingSite.brand}</title>
  <meta name="description" content={marketingSite.pricing.subhead} />
</svelte:head>

<section class="mk-hero mk-hero-tight">
  <span class="mk-eyebrow">{marketingSite.pricing.eyebrow}</span>
  <h1>{marketingSite.pricing.headline}</h1>
  <p>{marketingSite.pricing.subhead}</p>
</section>

<div class="mk-section">
  <PricingModule useStripeLinks={false} />

  <div class="mk-enterprise-banner">
    <p>
      <strong>Need more than 100 seats?</strong>
      If you require more than 100 seats, <a
        href="https://cal.com/danny-cursus/15min"
        target="_blank"
        rel="noreferrer">reach out and we can talk</a
      >. This enterprise offering includes custom-configured workspaces,
      dedicated onboarding, and platinum support.
    </p>
  </div>

  <section class="mk-section" id="faq">
    <div class="mk-section-head text-center">
      <span class="mk-eyebrow">{marketingSite.faq.eyebrow}</span>
      <h2>{marketingSite.faq.headline}</h2>
      <p>{marketingSite.faq.subhead}</p>
    </div>

    <div class="mk-faq-list">
      {#each marketingSite.faq.items as item}
        <details class="mk-faq-item">
          <summary>
            <span>{item.q}</span>
            <ChevronRight size={18} class="mk-faq-arrow" />
          </summary>
          <div class="mk-faq-answer">
            {item.a}
          </div>
        </details>
      {/each}
    </div>
  </section>
</div>
