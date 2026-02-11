<script lang="ts">
  import { methodPath } from "$lib/marketing/method"

  let { data } = $props()
</script>

<svelte:head>
  <title>{data.section.title} | SystemsCraft Method</title>
  <meta name="description" content={data.section.summary} />
</svelte:head>

<article class="mk-method-article">
  <header>
    <span class="mk-eyebrow">
      Step {String(data.index + 1).padStart(2, "0")} / {String(data.total).padStart(2, "0")}
    </span>
    <h1>{data.section.title}</h1>
    <p>{data.section.intro}</p>
  </header>

  <section class="mk-method-actions">
    {#each data.section.actions as item}
      <div class="mk-method-action-card">
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </div>
    {/each}
  </section>

  <nav class="mk-method-nav" aria-label="Method navigation">
    {#if data.previous}
      <a href={methodPath(data.previous.slug)}>&larr; {data.previous.title}</a>
    {:else}
      <span></span>
    {/if}

    {#if data.next}
      <a href={methodPath(data.next.slug)}>{data.next.title} &rarr;</a>
    {:else}
      <a href="/contact">Talk to us &rarr;</a>
    {/if}
  </nav>
</article>
