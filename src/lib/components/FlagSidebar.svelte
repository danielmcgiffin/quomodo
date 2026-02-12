<script lang="ts">
  type FlagSidebarItem = {
    id: string
    href: string
    flagType?: string
    createdAt: string
    message: string
    context?: string
    targetPath?: string
  }

  export let title = "Flags"
  export let flags: FlagSidebarItem[] = []
  export let highlightedFlagId: string | null = null
</script>

<section
  class={`sc-section sc-flags-sidebar ${flags.length === 0 ? "is-empty" : ""}`}
>
  <div class="sc-section-title sc-sidebar-title">{title}</div>
  {#if flags.length === 0}
    <div class="sc-card sc-flags-sidebar-placeholder" aria-hidden="true"></div>
  {:else}
    {#each flags as flag (flag.id)}
      <a
        class={`sc-card sc-card-flag sc-flag-link ${flag.id === highlightedFlagId ? "is-highlighted" : ""}`}
        href={flag.href}
      >
        <div class="sc-byline">
          <div class="sc-flag-banner">
            ⚑ {flag.context}
          </div>
        </div>
        <div class="sc-copy-md">
          {flag.message}
        </div>
        <div class="sc-byline sc-byline-stack">
          <slot name="flag-context" {flag}>
            {#if flag.context}
              <span class="sc-portal-name">{flag.context}</span>
            {/if}
            <span class="sc-pill">{flag.createdAt}</span>
            {#if flag.context && flag.targetPath}
              <span>·</span>
            {/if}
            {#if flag.targetPath}
              <span>Path: {flag.targetPath}</span>
            {/if}
          </slot>
        </div>
      </a>
    {/each}
  {/if}
</section>
