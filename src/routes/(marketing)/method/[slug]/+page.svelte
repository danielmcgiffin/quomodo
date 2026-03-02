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
      Step {String(data.index + 1).padStart(2, "0")} / {String(data.total).padStart(
        2,
        "0",
      )}
    </span>
    <h1>{data.section.title}</h1>
    <p>{data.section.intro}</p>
  </header>

  <section class="mk-method-actions">
    {#each data.section.actions as item, actionIndex}
      <article class="mk-method-action-card">
        <p class="mk-method-action-index">Action {String(actionIndex + 1).padStart(2, "0")}</p>
        <h2>{item.title}</h2>
        <p>{item.description}</p>
      </article>
    {/each}
  </section>

  <nav class="mk-method-nav" aria-label="Method navigation">
    {#if data.previous}
      <a class="mk-btn mk-btn-quiet" href={methodPath(data.previous.slug)}
        >&larr; {data.previous.title}</a
      >
    {:else}
      <span></span>
    {/if}

    {#if data.next}
      <a class="mk-btn mk-btn-primary" href={methodPath(data.next.slug)}
        >{data.next.title} &rarr;</a
      >
    {:else}
      <a class="mk-btn mk-btn-primary" href="/contact">Talk to us &rarr;</a>
    {/if}
  </nav>
</article>
