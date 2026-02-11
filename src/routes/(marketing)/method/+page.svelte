<script lang="ts">
  import { methodSections, methodPath } from "$lib/marketing/method"
</script>

<svelte:head>
  <title>SystemsCraft Method</title>
  <meta name="description" content="The SystemsCraft method for mapping and maintaining an operational atlas." />
</svelte:head>

<section class="mk-hero mk-hero-tight">
  <span class="mk-eyebrow">The Method</span>
  <h1>Build operational clarity that survives real work.</h1>
  <p>
    This framework turns undocumented execution into a connected atlas. Start with the biggest bottleneck,
    model the triad chain, and keep the map alive through usage.
  </p>
</section>

<section class="mk-section">
  <ol class="mk-method-list">
    {#each methodSections as section, index}
      <li>
        <a class="mk-method-link" href={methodPath(section.slug)}>
          <span class="mk-method-index">{String(index + 1).padStart(2, "0")}</span>
          <span>
            <strong>{section.title}</strong>
            <small>{section.summary}</small>
          </span>
          <span class="mk-method-arrow">-></span>
        </a>
      </li>
    {/each}
  </ol>
</section>
