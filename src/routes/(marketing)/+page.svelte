<script lang="ts">
  import { marketingSite } from "$lib/marketing/site"
</script>

<svelte:head>
  <title>SystemsCraft | Operational Atlas</title>
  <meta
    name="description"
    content="SystemsCraft maps roles, processes, and systems as a connected operational atlas so teams retrieve answers without escalation."
  />
</svelte:head>

<section class="mk-hero">
  <span class="mk-eyebrow">{marketingSite.hero.eyebrow}</span>
  <h1>{marketingSite.hero.title}</h1>
  <p>{marketingSite.hero.subtitle}</p>
  <div class="mk-cta-row">
    <a class="mk-btn mk-btn-primary" href={marketingSite.primaryCta.href}>{marketingSite.primaryCta.label}</a>
    <a class="mk-btn mk-btn-quiet" href="/method">Read The Method</a>
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <h2>The Retrieval Test</h2>
    <p>Every product decision is judged by one standard: can someone enter from any angle and find what they need in one interaction?</p>
  </div>
  <div class="mk-query-grid">
    <article class="mk-query-card">
      <h3>Role Entry</h3>
      <p>"What does the Ops Manager do on Mondays?"</p>
    </article>
    <article class="mk-query-card">
      <h3>System Entry</h3>
      <p>"What breaks if we cancel HubSpot?"</p>
    </article>
    <article class="mk-query-card">
      <h3>Process Entry</h3>
      <p>"Who handles client onboarding and in which system?"</p>
    </article>
    <article class="mk-query-card">
      <h3>Flag Entry</h3>
      <p>"What is stale or blocked right now?"</p>
    </article>
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <h2>How SystemsCraft Works</h2>
    <p>The atlas is built from role-action-system chains and exposed as portals across process, role, system, and flag views.</p>
  </div>
  <div class="mk-feature-grid">
    {#each marketingSite.pillars as pillar}
      <article class="mk-feature-card">
        <h3>{pillar.title}</h3>
        <p>{pillar.description}</p>
      </article>
    {/each}
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <h2>What Changes</h2>
    <p>SystemsCraft is designed to eliminate retrieval tax and reduce dependence on heroic operators.</p>
  </div>
  <ul class="mk-outcome-list">
    {#each marketingSite.outcomes as outcome}
      <li>{outcome}</li>
    {/each}
  </ul>
</section>

<section class="mk-cta-band">
  <h2>Stop babysitting. Start building.</h2>
  <p>Build the map once, keep it alive through use, and let teams retrieve answers where decisions are made.</p>
  <div class="mk-cta-row">
    <a class="mk-btn mk-btn-primary" href="/app/processes">Enter The Atlas</a>
    <a class="mk-btn mk-btn-quiet" href="/partners">Partner With SystemsCraft</a>
  </div>
</section>
