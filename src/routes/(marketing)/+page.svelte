<script lang="ts">
  import { marketingSite } from "$lib/marketing/site"
  import RotatingWords from "$lib/components/RotatingWords.svelte"
  import {
    Rocket,
    RefreshCw,
    Palmtree,
    BellRing,
    Users,
    TrendingUp,
    Check,
    ArrowRight,
    ChevronRight,
  } from "lucide-svelte"

  const iconMap: Record<string, typeof Rocket> = {
    rocket: Rocket,
    "refresh-cw": RefreshCw,
    palmtree: Palmtree,
    "bell-ring": BellRing,
    users: Users,
    "trending-up": TrendingUp,
  }
</script>

<svelte:head>
  <title>{marketingSite.brand} | {marketingSite.tagline}</title>
  <meta name="description" content={marketingSite.hero.subtitle} />
</svelte:head>

<!-- HERO -->
<section class="mk-hero">
  <span class="mk-eyebrow">{marketingSite.hero.eyebrow}</span>
  <h1>
    {marketingSite.hero.headline}
    <RotatingWords
      words={[
        "dead docs",
        '"ask Sarah"',
        "dropped balls",
        "wiki sprawl",
        "tribal ops",
        '"who does this?"',
        "SOP graveyards",
        "documentation theater",
        "bad handoffs",
      ]}
    />
  </h1>
  <p>{marketingSite.hero.subtitle}</p>
  <div class="mk-cta-row">
    <a class="mk-btn mk-btn-primary" href={marketingSite.primaryCta.href}>
      {marketingSite.primaryCta.label} <ArrowRight size={16} class="ml-2" />
    </a>
    <a class="mk-btn mk-btn-quiet" href="/method">Read The Method</a>
  </div>
</section>

<!-- DEMO -->
<div class="mk-demo-box">
  <div class="mk-demo-inner">
    <div class="mk-demo-header">
      <div class="mk-demo-dots">
        <span></span><span></span><span></span>
      </div>
      <div class="mk-demo-title">Operational Atlas</div>
    </div>
    <img
      src={marketingSite.demo.gifSrc}
      alt={marketingSite.demo.alt}
      class="mk-demo-img"
    />
  </div>
</div>

<!-- PROBLEM: FOR YOU -->
<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.forYou.eyebrow}</span>
    <h2>{marketingSite.forYou.headline}</h2>
  </div>
  <div class="mk-outcome-list">
    {#each marketingSite.forYou.bullets as bullet}
      <li>{bullet}</li>
    {/each}
  </div>
  <p class="mk-punchline">{marketingSite.forYou.punchline}</p>
</section>

<!-- HOW IT WORKS -->
<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.howItWorks.eyebrow}</span>
    <h2>{marketingSite.howItWorks.headline}</h2>
    <p>{marketingSite.howItWorks.subhead}</p>
  </div>

  <div class="mk-workflow-grid">
    <div class="mk-workflow-steps">
      {#each marketingSite.howItWorks.steps as step}
        <div class="mk-step-card">
          <div class="mk-step-num">{step.n}</div>
          <div class="mk-step-content">
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        </div>
      {/each}
    </div>

    <div class="mk-workflow-side">
      {#each marketingSite.howItWorksSide.cards as card}
        <div class="mk-side-card">
          <h3>{card.title}</h3>
          <div class="mk-side-items">
            {#each card.items as item}
              <div class="mk-side-item">
                <span>{item.k}</span>
                <span class="mk-side-val">{item.v}</span>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- IMPLEMENTATION CALLOUT -->
<div class="mk-cta-band">
  <h2>{marketingSite.implementationCallout.headline}</h2>
  <p>{marketingSite.implementationCallout.text}</p>
  <div class="mk-cta-row">
    <a
      class="mk-btn mk-btn-quiet"
      href={marketingSite.implementationCallout.cta.href}
      target="_blank"
      rel="noreferrer"
    >
      {marketingSite.implementationCallout.cta.label}
    </a>
  </div>
</div>

<!-- FEATURES -->
<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.features.eyebrow}</span>
    <h2>{marketingSite.features.headline}</h2>
    <p>{marketingSite.features.subhead}</p>
  </div>
  <div class="mk-feature-grid">
    {#each marketingSite.features.items as item}
      <article class="mk-feature-card">
        <div class="mk-feature-icon">
          <svelte:component this={iconMap[item.icon]} size={20} />
        </div>
        <h3>{item.title}</h3>
        <p>{item.desc}</p>
      </article>
    {/each}
  </div>
</section>

<!-- PRICING -->
<section class="mk-section" id="pricing">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.pricing.eyebrow}</span>
    <h2>{marketingSite.pricing.headline}</h2>
    <p>{marketingSite.pricing.subhead}</p>
  </div>

  <div class="mk-pricing-grid">
    {#each marketingSite.pricing.plans as plan}
      <div class="mk-pricing-card" class:featured={plan.featured}>
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
        <a class="mk-btn mk-btn-primary w-full mt-auto" href={plan.cta.href}>
          {plan.cta.label}
        </a>
      </div>
    {/each}
  </div>
</section>

<!-- FAQ -->
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

<style>
  .mk-demo-box {
    margin-top: 3rem;
    padding: 1px;
    background: linear-gradient(
      to bottom,
      var(--mk-border),
      rgba(201, 168, 76, 0.2),
      transparent
    );
    border-radius: 20px;
  }

  .mk-demo-inner {
    background: var(--mk-bg-card);
    border-radius: 19px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .mk-demo-header {
    background: rgba(255, 255, 255, 0.03);
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--mk-border);
  }

  .mk-demo-dots {
    display: flex;
    gap: 6px;
  }

  .mk-demo-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--mk-border);
  }

  .mk-demo-title {
    margin-left: 1rem;
    font-size: 0.75rem;
    color: var(--mk-text-secondary);
    font-weight: 600;
  }

  .mk-demo-img {
    display: block;
    width: 100%;
    opacity: 0.9;
  }

  .mk-punchline {
    margin-top: 1.5rem;
    font-weight: 600;
    font-size: 1.1rem;
    text-align: center;
  }

  .mk-workflow-grid {
    margin-top: 2rem;
    display: grid;
    gap: 2.5rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 960px) {
    .mk-workflow-grid {
      grid-template-columns: 1.4fr 1fr;
    }
  }

  .mk-workflow-steps {
    display: grid;
    gap: 1rem;
  }

  .mk-step-card {
    display: flex;
    gap: 1.25rem;
    padding: 1.25rem;
    border: 1px solid var(--mk-border);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.02);
  }

  .mk-step-num {
    flex-shrink: 0;
    width: 2.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 99px;
    border: 1px solid var(--mk-border);
    background: rgba(0, 0, 0, 0.3);
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--mk-gold-text);
  }

  .mk-step-content h3 {
    font-size: 1rem;
    font-weight: 700;
  }

  .mk-step-content p {
    margin-top: 0.25rem;
    font-size: 0.9rem;
    color: var(--mk-text-secondary);
  }

  .mk-workflow-side {
    display: grid;
    gap: 1.25rem;
    align-content: start;
  }

  .mk-side-card {
    padding: 1.5rem;
    border: 1px solid var(--mk-border);
    border-radius: 16px;
    background: var(--mk-bg-card);
  }

  .mk-side-card h3 {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
    color: var(--mk-text-secondary);
  }

  .mk-side-items {
    display: grid;
    gap: 0.75rem;
  }

  .mk-side-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--mk-border);
    border-radius: 10px;
    font-size: 0.85rem;
  }

  .mk-side-val {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--mk-text-secondary);
  }

  .mk-feature-icon {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid var(--mk-border);
    background: rgba(255, 255, 255, 0.03);
    color: var(--mk-gold-text);
    margin-bottom: 1rem;
  }

  .mk-feature-icon :global(svg) {
    /* Ensuring icon color follows parent if not specified */
  }

  .mk-pricing-grid {
    margin-top: 2rem;
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .mk-pricing-card {
    position: relative;
    padding: 2rem 1.5rem;
    border: 1px solid var(--mk-border);
    border-radius: 20px;
    background: var(--mk-bg-card);
    display: flex;
    flex-direction: column;
  }

  .mk-pricing-card.featured {
    border-color: rgba(201, 168, 76, 0.4);
    background: linear-gradient(
      180deg,
      rgba(201, 168, 76, 0.05),
      var(--mk-bg-card)
    );
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  .mk-pricing-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--mk-gold);
    color: #000;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    white-space: nowrap;
  }

  .mk-pricing-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .mk-plan-name {
    font-size: 1.1rem;
    font-weight: 700;
  }

  .mk-plan-price {
    font-size: 1.75rem;
    font-weight: 700;
  }

  .mk-plan-price small {
    font-size: 0.85rem;
    font-weight: 400;
    color: var(--mk-text-secondary);
  }

  .mk-plan-desc {
    font-size: 0.85rem;
    color: var(--mk-text-secondary);
    margin-bottom: 1.5rem;
    min-height: 3rem;
  }

  .mk-plan-perks {
    margin-bottom: 2rem;
    display: grid;
    gap: 0.6rem;
  }

  .mk-plan-perks li {
    list-style: none;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--mk-text-secondary);
  }

  .mk-faq-list {
    margin: 2rem auto 0;
    max-width: 760px;
    display: grid;
    gap: 0.75rem;
  }

  .mk-faq-item {
    border: 1px solid var(--mk-border);
    border-radius: 12px;
    background: var(--mk-bg-card);
    overflow: hidden;
  }

  .mk-faq-item summary {
    padding: 1rem 1.25rem;
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .mk-faq-item summary::-webkit-details-marker {
    display: none;
  }

  :global(.mk-faq-arrow) {
    transition: transform 0.2s ease;
    color: var(--mk-gold-text);
  }

  .mk-faq-item[open] :global(.mk-faq-arrow) {
    transform: rotate(90deg);
  }

  .mk-faq-answer {
    padding: 0 1.25rem 1.25rem;
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--mk-text-secondary);
  }
</style>
