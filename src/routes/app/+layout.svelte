<script lang="ts">
  import "../../app.css"
  import { page } from "$app/stores"
  import AppSearchOverlay from "$lib/components/AppSearchOverlay.svelte"

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
  let isSearchOpen = $state(false)

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

  const onWindowKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || !event.ctrlKey || event.metaKey || event.altKey) {
      return
    }

    const isCtrlQuestionShortcut =
      event.key === "?" || (event.key === "/" && event.shiftKey)
    if (!isCtrlQuestionShortcut) {
      return
    }

    event.preventDefault()
    isSearchOpen = true
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="sc-app">
  <nav class="sc-nav width-full mx-64">
    <div class="sc-nav-inner">
      <div class="sc-nav-edge sc-nav-edge--start">
        <a class="sc-brand" href="/app/processes">
          <img
            src="/images/1746823640049.jpeg"
            alt="SystemsCraft"
            width="36"
            height="36"
          />
          <span>SystemsCraft</span>
        </a>
      </div>
      <div class="sc-nav-body">
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
      </div>
      <div class="sc-nav-edge sc-nav-edge--end">
        <div class="sc-actions">
          <button
            class="sc-search"
            type="button"
            onclick={() => {
              isSearchOpen = true
            }}
          >
            <span>Search</span>
            <span>(Ctrl-?)</span>
          </button>
          <span
            class="sc-avatar sc-avatar-nav"
          >
            {data.viewerInitials}
          </span>
        </div>
      </div>
    </div>
  </nav>
  {@render children?.()}
  <AppSearchOverlay bind:open={isSearchOpen} />
</div>
