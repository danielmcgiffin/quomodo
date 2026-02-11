<script lang="ts">
  import "../../app.css"
  import { page } from "$app/stores"

  interface Props {
    data: {
      org: {
        id: string
        name: string
        role: string
      }
      navCounts: {
        processes: number
        roles: number
        systems: number
        flags: number
      }
      viewerInitials: string
    }
    children?: import("svelte").Snippet
  }

  let { data, children }: Props = $props()

  const navItems = $derived.by(() => [
    {
      label: "Processes",
      href: "/app/processes",
      count: data.navCounts.processes,
    },
    { label: "Roles", href: "/app/roles", count: data.navCounts.roles },
    { label: "Systems", href: "/app/systems", count: data.navCounts.systems },
    { label: "Flags", href: "/app/flags", count: data.navCounts.flags },
  ])
</script>

<div class="sc-app">
  <nav class="sc-nav">
    <div class="sc-nav-inner">
      <div class="sc-tabs">
        {#each navItems as item}
          <a
            class={`sc-tab ${$page.url.pathname.startsWith(item.href) ? "is-active" : ""}`}
            href={item.href}
          >
            <span>{item.label} ({item.count})</span>
          </a>
        {/each}
      </div>
      <div class="sc-actions">
        <button class="sc-search" type="button">
          <span>Search</span>
          <span>⌘K</span>
        </button>
        <span class="sc-avatar" style="--avatar-size:36px;--avatar-font:14px;">
          {data.viewerInitials}
        </span>
      </div>
    </div>
  </nav>
  {@render children?.()}
</div>
