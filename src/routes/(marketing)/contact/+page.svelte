<script lang="ts">
  import { marketingSite } from "$lib/marketing/site"
</script>

<svelte:head>
  <title>Contact SystemsCraft</title>
  <meta
    name="description"
    content="Contact SystemsCraft to scope an AI operations engagement for your team."
  />
</svelte:head>

<section class="mk-hero mk-hero-tight">
  <span class="mk-eyebrow">Contact</span>
  <h1>Bring us your highest-friction workflow.</h1>
  <p>
    We start where execution is breaking down, then build a clear operating
    structure your team can trust.
  </p>
</section>

<section class="mk-section">
  <div class="mk-feature-grid">
    <article class="mk-feature-card mk-feature-card--primary">
      <h2>Book a call</h2>
      <p>
        Scope fit, operating constraints, and what the first delivery sprint
        should produce.
      </p>
      <a class="mk-btn mk-btn-primary" href={marketingSite.secondaryCta.href}>
        Book 15-minute intro
      </a>
    </article>

    <article class="mk-feature-card">
      <h2>Email</h2>
      <p>
        Prefer async? Send current bottlenecks, team size, and system stack.
      </p>
      <a class="mk-btn mk-btn-quiet" href="mailto:danny@systemscraft.co"
        >danny@systemscraft.co</a
      >
    </article>

    <article class="mk-feature-card">
      <h2>Need form workflow?</h2>
      <p>
        For teams requiring a formal intake path, the detailed contact form is
        still available.
      </p>
      <a class="mk-btn mk-btn-quiet" href="/contact_us">Use contact form</a>
    </article>
  </div>
</section>
