<script lang="ts">
  import { marketingSite } from "$lib/marketing/site"
</script>

<svelte:head>
  <title>SystemsCraft Partners</title>
  <meta
    name="description"
    content="Partner with SystemsCraft to deliver AI-ready operations for SMB clients."
  />
</svelte:head>

<section class="mk-hero mk-hero-tight">
  <span class="mk-eyebrow">Partners</span>
  <h1>Bring premium AI Ops delivery to every client engagement.</h1>
  <p>
    SystemsCraft helps fractional operators, consultants, and implementation
    teams deliver structured operational systems that survive handoff and scale.
  </p>
  <div class="mk-cta-row">
    <a class="mk-btn mk-btn-primary" href={marketingSite.secondaryCta.href}>
      Book Intro Call
    </a>
    <a class="mk-btn mk-btn-quiet" href="/method">Review the method</a>
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">Common Failure Modes</span>
    <h2>Most ops engagements break after handoff.</h2>
    <p>
      We solve for maintainability, not presentation polish. The model is built
      to hold when you are no longer in the room.
    </p>
  </div>

  <div class="mk-feature-grid">
    <article class="mk-feature-card">
      <h3>Documentation theater</h3>
      <p>
        Playbooks look complete, but ownership and execution paths remain
        ambiguous in production.
      </p>
    </article>
    <article class="mk-feature-card">
      <h3>Load-bearing consultants</h3>
      <p>
        Clients keep escalating because the system was never designed for
        independent retrieval.
      </p>
    </article>
    <article class="mk-feature-card">
      <h3>One-off frameworks</h3>
      <p>
        Every engagement starts from scratch instead of reusing a structured
        operating model.
      </p>
    </article>
  </div>
</section>

<section class="mk-section">
  <div class="mk-section-head">
    <span class="mk-eyebrow">Delivery Sequence</span>
    <h2>Modular, repeatable, operator-led.</h2>
    <p>Use one framework across client accounts without losing specificity.</p>
  </div>

  <ol class="mk-method-list">
    <li>
      <div class="mk-method-link static">
        <span class="mk-method-index">01</span>
        <span>
          <strong>Anchor on the highest-friction workflow</strong>
          <small>Map one process end-to-end with explicit owners and systems.</small>
        </span>
      </div>
    </li>
    <li>
      <div class="mk-method-link static">
        <span class="mk-method-index">02</span>
        <span>
          <strong>Expand through connected portals</strong>
          <small>Traverse linked roles, systems, and dependencies to grow the atlas.</small>
        </span>
      </div>
    </li>
    <li>
      <div class="mk-method-link static">
        <span class="mk-method-index">03</span>
        <span>
          <strong>Transfer maintainable operating control</strong>
          <small>Leave a live system that teams can govern without consultant dependency.</small>
        </span>
      </div>
    </li>
  </ol>
</section>
