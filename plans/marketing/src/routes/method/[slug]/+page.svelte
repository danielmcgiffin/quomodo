<script lang="ts">
  import { methodPath } from "$lib/method";
  import type { MethodSection } from "$lib/method";
  import type { MethodContentSection } from "$lib/method-content";

  export let data: {
    section: MethodContentSection;
    idx: number;
    prev: MethodSection | null;
    next: MethodSection | null;
    total: number;
  };
</script>

<article class="space-y-8">
  <header>
    <span class="text-xs font-medium uppercase tracking-[0.16em] text-[rgb(var(--muted))]/60 tabular-nums">
      {String(data.idx + 1).padStart(2, '0')} / {String(data.total).padStart(2, '0')}
    </span>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight gradient-text md:text-4xl">{data.section.title}</h1>
    <p class="mt-4 text-pretty text-[rgb(var(--text-secondary))] leading-relaxed">{data.section.intro}</p>
  </header>

  {#if data.section.groups.length > 1}
    <div class="space-y-14">
      {#each data.section.groups as group, gi}
        <div>
          {#if group.title}
            <h2 class="text-lg font-semibold md:text-xl">{group.title}</h2>
          {/if}
          <div class="mt-6 space-y-8">
            {#each group.items as item}
              <section id={item.id} class="scroll-mt-24">
                <h3>{item.title}</h3>
                <p class="mt-2">{item.desc}</p>
              </section>
            {/each}
          </div>
        </div>
        {#if gi < data.section.groups.length - 1}
          <hr class="border-[rgb(var(--border))]" />
        {/if}
      {/each}
    </div>
  {:else}
    <div class="space-y-8">
      {#each data.section.groups[0].items as item}
        <section id={item.id} class="scroll-mt-24">
          <h3>{item.title}</h3>
          <p class="mt-2">{item.desc}</p>
        </section>
      {/each}
    </div>
  {/if}

  <!-- Prev / Next navigation -->
  <div class="border-t border-[rgb(var(--border))] pt-8 mt-12">
    <div class="flex items-stretch justify-between gap-4">
      {#if data.prev}
        <a class="group flex flex-col gap-1 text-left" href={methodPath(data.prev.slug)}>
          <span class="text-xs text-[rgb(var(--muted))]/60">← Previous</span>
          <span class="text-sm font-medium text-[rgb(var(--muted))] transition-colors duration-200 group-hover:text-white">{data.prev.title}</span>
        </a>
      {:else}
        <div></div>
      {/if}

      {#if data.next}
        <a class="group flex flex-col items-end gap-1 text-right" href={methodPath(data.next.slug)}>
          <span class="text-xs text-[rgb(var(--muted))]/60">Next →</span>
          <span class="text-sm font-medium text-[rgb(var(--muted))] transition-colors duration-200 group-hover:text-white">{data.next.title}</span>
        </a>
      {:else}
        <a class="group flex flex-col items-end gap-1 text-right" href="/contact">
          <span class="text-xs text-[rgb(var(--muted))]/60">Done →</span>
          <span class="text-sm font-medium text-[rgb(var(--muted))] transition-colors duration-200 group-hover:text-white">Talk to us</span>
        </a>
      {/if}
    </div>
  </div>
</article>
