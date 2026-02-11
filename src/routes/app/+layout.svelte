<script lang="ts">
  import "../../app.css"
  import { page } from "$app/stores"
  import {
    processes,
    roles,
    systems,
    flags,
  } from "$lib/data/atlas"

  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()

  const navItems = [
    { label: "Processes", href: "/app/processes", count: processes.length },
    { label: "Roles", href: "/app/roles", count: roles.length },
    { label: "Systems", href: "/app/systems", count: systems.length },
    { label: "Flags", href: "/app/flags", count: flags.length },
  ]
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
        <span class="sc-avatar" style="--avatar-size:36px;--avatar-font:14px;">DM</span>
      </div>
    </div>
  </nav>
  {@render children?.()}
</div>
