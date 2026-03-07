<script lang="ts">
  import { ThumbsUp } from "lucide-svelte"
  import type { Snippet } from "svelte"

  type FlagSidebarItem = {
    id: string
    href: string
    flagType?: string
    createdAt: string
    message: string
    context?: string
    targetPath?: string
  }

  interface Props {
    title?: string
    flags?: FlagSidebarItem[]
    highlightedFlagId?: string | null
    flagContext?: Snippet<[{ flag: FlagSidebarItem }]>
  }

  let {
    title = "Flags",
    flags = [],
    highlightedFlagId = null,
    flagContext,
  }: Props = $props()
</script>

<section
  class={`sc-section sc-flags-sidebar ${flags.length === 0 ? "is-empty" : ""}`}
>
  <div
    class="sc-section-title px-1 text-xs font-bold uppercase tracking-widest text-slate-500 mb-4"
  >
    {title}
  </div>
  {#if flags.length === 0}
    <div class="sc-flags-sidebar-empty sc-flags-sidebar-placeholder">
      <div class="flex flex-col items-center justify-center gap-2 py-10">
        <ThumbsUp class="h-7 w-7" stroke-width={1.5} aria-hidden="true" />
        <div class="text-sm font-semibold">All clear</div>
      </div>
    </div>
  {:else}
    {#each flags as flag (flag.id)}
      <a
        class={`sc-card sc-card-flag sc-flag-link ${flag.id === highlightedFlagId ? "is-highlighted" : ""}`}
        id={`flag-${flag.id}`}
        href={flag.href}
      >
        <div class="sc-byline">
          <div class="sc-flag-banner">
            <span aria-hidden="true">⚑</span>
            {#if flagContext}
              {@render flagContext({ flag })}
            {:else if flag.context}
              <span class="sc-portal-name">{flag.context}</span>
            {/if}
          </div>
        </div>
        <div class="sc-copy-md">
          {flag.message}
        </div>
        <div class="sc-byline sc-byline-stack"></div>
        <span class="sc-pill">{flag.createdAt}</span>
        {#if flag.context && flag.targetPath}
          <span>·</span>
        {/if}
        {#if flag.targetPath}
          <span>Path: {flag.targetPath}</span>
        {/if}
      </a>
    {/each}
  {/if}
</section>
