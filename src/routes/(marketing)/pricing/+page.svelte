<script lang="ts">
  import { page } from "$app/stores"
  import PricingModule from "$lib/marketing/PricingModule.svelte"
  import { marketingSite } from "$lib/marketing/site"
  import { ChevronRight } from "lucide-svelte"

  const withProxyPrefix = (href: string): string => {
    if (!href.startsWith("/") || href.startsWith("//")) {
      return href
    }
    const match = $page.url.pathname.match(/^\/proxy\/\d+/)
    return match ? `${match[0]}${href}` : href
  }
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

<section class="mk-section">
  <PricingModule useStripeLinks={false} />

  <div class="mk-enterprise-banner">
    <h3>Need a bespoke implementation scope?</h3>
    <p>
      For larger teams or multi-workspace rollouts, we provide scoped delivery,
      onboarding support, and custom implementation plans.
    </p>
    <a
      class="mk-btn mk-btn-quiet"
      href={withProxyPrefix(marketingSite.secondaryCta.href)}
    >
      Book scope call
    </a>
  </div>
</section>

<section class="mk-section" id="faq">
  <div class="mk-section-head">
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
        <div class="mk-faq-answer">{item.a}</div>
      </details>
    {/each}
  </div>
</section>
