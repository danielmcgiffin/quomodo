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
    <div class="sc-flags-sidebar-empty sc-flags-sidebar-placeholder" aria-hidden="true">
      <div class="flex flex-col items-center justify-center gap-2 py-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          class="h-7 w-7"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.498 18.485A2.25 2.25 0 0 1 5.25 16.238V7.5A2.25 2.25 0 0 1 7.5 5.25h1.846a.75.75 0 0 0 .69-.462l.932-2.233A.75.75 0 0 1 11.659 2h1.091c.901 0 1.644.73 1.644 1.631v1.066c0 .348-.09.69-.26.99l-1.308 2.28h4.139c1.093 0 1.918.986 1.705 2.06l-1.069 5.35a2.25 2.25 0 0 1-2.207 1.81H7.498Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5.25 7.5H4.5A2.25 2.25 0 0 0 2.25 9.75v6a2.25 2.25 0 0 0 2.25 2.25h.75"
          />
        </svg>
        <div class="text-sm font-semibold">All clear</div>
      </div>
    </div>
  {:else}
    {#each flags as flag (flag.id)}
      <a
        class={`sc-card sc-card-flag sc-flag-link ${flag.id === highlightedFlagId ? "is-highlighted" : ""}`}
        href={flag.href}
      >
        <div class="sc-byline">
          <div class="sc-flag-banner">
            ⚑
            <slot name="flag-context" {flag}>
              {#if flag.context}
                <span class="sc-portal-name">{flag.context}</span>
              {/if}
            </slot>
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
