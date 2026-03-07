<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { marketingSite } from "$lib/marketing/site"
  import PricingModule from "$lib/marketing/PricingModule.svelte"
  import {
    ArrowRight,
    Factory,
    ShieldCheck,
    Workflow,
    Wrench,
    ChevronRight,
  } from "lucide-svelte"

  const operationalPillars = [
    {
      title: "Structured systems first",
      detail:
        "We convert tribal workflows into explicit role-action-system chains your team can run without heroics.",
      icon: Workflow,
    },
    {
      title: "Automation with guardrails",
      detail:
        "AI is introduced as an operational utility with ownership boundaries, failure states, and controls.",
      icon: ShieldCheck,
    },
    {
      title: "Industrial reliability",
      detail:
        "Every engagement is designed for consistency under load, not one-off novelty demos.",
      icon: Factory,
    },
  ]

  const commandMetrics = [
    "Clarity before automation",
    "Owner assigned to every operational step",
    "Process drift surfaced through maintenance checks",
    "Built for SMB constraints and execution speed",
  ]

  const demoImageSrc = $derived.by(() => {
    const source = marketingSite.demo.gifSrc
    if (!source.startsWith("/")) {
      return source
    }

    const match = $page.url.pathname.match(/^\/proxy\/\d+/)
    return match ? `${match[0]}${source}` : source
  })

  const withProxyPrefix = (href: string): string => {
    if (!href.startsWith("/") || href.startsWith("//")) {
      return href
    }
    const match = $page.url.pathname.match(/^\/proxy\/\d+/)
    return match ? `${match[0]}${href}` : href
  }

  const navigateInternal = (event: MouseEvent, href: string): void => {
    if (!href.startsWith("/") || href.startsWith("//")) {
      return
    }
    event.preventDefault()
    goto(withProxyPrefix(href))
  }
</script>

<svelte:head>
  <title>{marketingSite.brand} | {marketingSite.tagline}</title>
  <meta name="description" content={marketingSite.hero.subtitle} />
</svelte:head>

<section class="mk-hero mk-hero-grid">
  <div>
    <span class="mk-eyebrow">{marketingSite.hero.eyebrow}</span>
    <h1>{marketingSite.hero.headline}</h1>
    <p>{marketingSite.hero.subtitle}</p>
    <p class="mk-hero-audience">{marketingSite.hero.audience}</p>

    <div class="mk-cta-row">
      <a
        class="mk-btn mk-btn-primary"
        href={withProxyPrefix(marketingSite.primaryCta.href)}
        onclick={(event) =>
          navigateInternal(event, marketingSite.primaryCta.href)}
      >
        {marketingSite.primaryCta.label}
        <ArrowRight size={15} />
      </a>
      <a
        class="mk-btn mk-btn-quiet"
        href={marketingSite.secondaryCta.href}
        target="_blank"
        rel="noreferrer"
      >
        {marketingSite.secondaryCta.label}
      </a>
    </div>

    <div class="mk-tag-row">
      <span class="mk-tag">SMB-FIRST</span>
      <span class="mk-tag">AI OPS</span>
      <span class="mk-tag">BOUTIQUE DELIVERY</span>
    </div>
  </div>

  <aside class="mk-command-card" aria-label="Command posture">
    <p class="mk-command-kicker">Operations command standard</p>
    <ul>
      {#each commandMetrics as metric}
        <li>{metric}</li>
      {/each}
    </ul>
  </aside>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.forYou.eyebrow}</span>
    <h2>{marketingSite.forYou.headline}</h2>
    <p>{marketingSite.forYou.punchline}</p>
  </div>

  <div class="mk-problem-grid">
    {#each marketingSite.forYou.bullets as bullet}
      <article class="mk-problem-card">
        <h3>Failure mode</h3>
        <p>{bullet}</p>
      </article>
    {/each}
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.howItWorks.eyebrow}</span>
    <h2>{marketingSite.howItWorks.headline}</h2>
    <p>{marketingSite.howItWorks.subhead}</p>
  </div>

  <div class="mk-workflow-grid">
    <div class="mk-workflow-steps">
      {#each marketingSite.howItWorks.steps as step}
        <article class="mk-step-card">
          <span class="mk-step-num">{step.n}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        </article>
      {/each}
    </div>

    <div class="mk-workflow-side">
      {#each marketingSite.howItWorksSide.cards as card}
        <article class="mk-side-card">
          <h3>{card.title}</h3>
          <ul>
            {#each card.items as item}
              <li>
                <span>{item.k}</span>
                <small>{item.v}</small>
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.features.eyebrow}</span>
    <h2>{marketingSite.features.headline}</h2>
    <p>{marketingSite.features.subhead}</p>
  </div>

  <div class="mk-feature-grid">
    {#each operationalPillars as pillar}
      {@const Icon = pillar.icon}
      <article class="mk-feature-card mk-feature-card--primary">
        <div class="mk-feature-icon">
          <Icon size={18} />
        </div>
        <h3>{pillar.title}</h3>
        <p>{pillar.detail}</p>
      </article>
    {/each}

    {#each marketingSite.features.items as item}
      <article class="mk-feature-card">
        <h3>{item.title}</h3>
        <p>{item.desc}</p>
      </article>
    {/each}
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">Operational Blueprint</span>
    <h2>See the structure before you automate it.</h2>
    <p>
      Visualize ownership, process flow, and system dependencies in one command
      surface.
    </p>
  </div>

  <div class="mk-demo-shell">
    <div class="mk-demo-head">
      <span>SystemsCraft Atlas</span>
      <span class="mk-demo-status">RUNNING</span>
    </div>
    <img src={demoImageSrc} alt={marketingSite.demo.alt} class="mk-demo-img" />
  </div>
</section>

<section class="mk-section" id="pricing">
  <div class="mk-section-head">
    <span class="mk-eyebrow">{marketingSite.pricing.eyebrow}</span>
    <h2>{marketingSite.pricing.headline}</h2>
    <p>{marketingSite.pricing.subhead}</p>
  </div>

  <PricingModule useStripeLinks={false} />

  <div class="mk-enterprise-banner">
    <h3>{marketingSite.implementationCallout.headline}</h3>
    <p>{marketingSite.implementationCallout.text}</p>
    <a
      class="mk-btn mk-btn-quiet"
      href={marketingSite.implementationCallout.cta.href}
      target="_blank"
      rel="noreferrer"
    >
      {marketingSite.implementationCallout.cta.label}
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

<section class="mk-cta-band">
  <h2>
    Bring your messiest process. We&apos;ll engineer the operating system.
  </h2>
  <p>
    SystemsCraft is intentionally boutique: deep operator collaboration,
    production-minded structure, and a practical path to AI leverage.
  </p>
  <div class="mk-cta-row">
    <a
      class="mk-btn mk-btn-primary"
      href={withProxyPrefix(marketingSite.primaryCta.href)}
      onclick={(event) =>
        navigateInternal(event, marketingSite.primaryCta.href)}
    >
      Start the build
      <Wrench size={15} />
    </a>
    <a
      class="mk-btn mk-btn-quiet"
      href={withProxyPrefix("/method")}
      onclick={(event) => navigateInternal(event, "/method")}
    >
      Review the method
      <ChevronRight size={15} />
    </a>
  </div>
</section>
