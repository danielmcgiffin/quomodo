<script lang="ts">
  import { methodSections, methodPath } from "$lib/method";
</script>

<svelte:head>
  <title>Method — Quaestor</title>
  <meta
    name="description"
    content="The Quaestor method: a practical system for mapping, owning, and maintaining how your company runs."
  />
</svelte:head>

<section class="space-y-16">
  <div>
    <h1 class="text-balance text-4xl font-semibold tracking-tight gradient-text md:text-5xl leading-[1.1]">
      The operational atlas,
      <span class="text-[rgb(var(--accent))]">step by step</span>
    </h1>
    <p class="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-[rgb(var(--text-secondary))] md:text-lg">
      Read the method like a playbook. Move through each section while keeping the map in view.
    </p>
    <div class="mt-8 flex flex-col gap-3 sm:flex-row">
      <a
        class="min-w-[170px] rounded-xl bg-[rgb(var(--accent))] px-4 py-2 text-center text-sm font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition hover:brightness-110"
        href={methodPath(methodSections[0].slug)}
      >
        Start at the top →
      </a>
      <a
        class="min-w-[170px] rounded-xl border border-[rgb(var(--border))] bg-white/5 px-4 py-2 text-center text-sm font-medium text-white/90 transition-colors duration-200 hover:bg-white/10"
        href="https://qstr.cursus.tools/demo/process"
      >
        See the product →
      </a>
    </div>
  </div>

  <ol class="space-y-0">
    {#each methodSections as section, i}
      <li>
        <a
          class="group flex items-start gap-5 py-6 transition-colors duration-200 hover:opacity-100"
          href={methodPath(section.slug)}
          style={i === 0 ? '' : ''}
        >
          <span class="mt-0.5 text-sm font-medium tabular-nums text-[rgb(var(--muted))]/50 w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
          <span class="flex-1">
            <span class="text-base font-semibold text-white group-hover:text-white/90 transition-colors duration-200">{section.title}</span>
            <span class="mt-2 block text-sm leading-relaxed text-[rgb(var(--muted))]">{section.summary}</span>
          </span>
          <span class="mt-1 text-[rgb(var(--muted))]/40 transition-all duration-200 group-hover:text-white group-hover:translate-x-0.5">→</span>
        </a>
        {#if i < methodSections.length - 1}
          <div class="border-b border-[rgb(var(--border))]"></div>
        {/if}
      </li>
    {/each}
  </ol>
</section>
