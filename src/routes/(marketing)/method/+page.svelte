<script lang="ts">
  import { methodSections, methodPath } from "$lib/marketing/method"
</script>

<svelte:head>
  <title>SystemsCraft Method</title>
  <meta
    name="description"
    content="The SystemsCraft method for building stable, AI-ready operations."
  />
</svelte:head>

<section class="mk-hero mk-hero-tight">
  <span class="mk-eyebrow">Method</span>
  <h1>A practical operating manual for AI-ready execution.</h1>
  <p>
    We treat operations as engineered infrastructure. Each step below is a
    modular component you can deploy in sequence or apply inside an existing
    engagement.
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
          <span class="mk-method-arrow">VIEW</span>
        </a>
      </li>
    {/each}
  </ol>
</section>
