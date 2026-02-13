<script lang="ts">
  import "../../app.css"
  import { resolve } from "$app/paths"
  import { page } from "$app/stores"
  import AppSearchOverlay from "$lib/components/AppSearchOverlay.svelte"

  interface Props {
    data: {
      org: {
        id: string
        name: string
        role: "owner" | "admin" | "editor" | "member"
      }
      navCounts: {
        processes: number
        roles: number
        systems: number
        flags: number
      }
      workspaceOptions: {
        id: string
        name: string
        role: "owner" | "admin" | "editor" | "member"
      }[]
      viewerInitials: string
    }
    children?: import("svelte").Snippet
  }

  let { data, children }: Props = $props()
  let isSearchOpen = $state(false)

  type NavHref =
    | "/app/processes"
    | "/app/roles"
    | "/app/systems"
    | "/app/flags"
    | "/app/team"
    | "/app/workspace"

  type NavItem = {
    label: string
    href: NavHref
    count?: number
  }

  const navItems = $derived.by(() => {
    const items: NavItem[] = [
      {
        label: "Processes",
        href: "/app/processes",
        count: data.navCounts.processes,
      },
      { label: "Roles", href: "/app/roles", count: data.navCounts.roles },
      { label: "Systems", href: "/app/systems", count: data.navCounts.systems },
      { label: "Flags", href: "/app/flags", count: data.navCounts.flags },
    ]

    if (data.org.role === "owner" || data.org.role === "admin") {
      items.push({ label: "Team", href: "/app/team" })
    }

    items.push({ label: "Workspace", href: "/app/workspace" })
    return items
  })

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
        <a class="sc-brand" href={resolve("/app/processes")}>
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
          {#each navItems as item (item.href)}
            <a
              class={`sc-tab ${$page.url.pathname.startsWith(resolve(item.href)) ? "is-active" : ""}`}
              href={resolve(item.href)}
            >
              <span>
                {item.label}
                {#if typeof item.count === "number"}
                  ({item.count})
                {/if}
              </span>
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
          <form
            class="max-w-56"
            method="POST"
            action={`${resolve("/app/workspace")}?/switchWorkspace`}
          >
            <input
              type="hidden"
              name="redirectTo"
              value={$page.url.pathname + $page.url.search}
            />
            <label class="sr-only" for="sc-nav-workspace">Switch workspace</label>
            <select
              id="sc-nav-workspace"
              class="sc-search sc-field max-w-56"
              name="workspaceId"
              value={data.org.id}
              onchange={(event) => {
                const form = event.currentTarget.form
                if (form) {
                  form.requestSubmit()
                }
              }}
            >
              {#each data.workspaceOptions as workspace (workspace.id)}
                <option value={workspace.id}>
                  {workspace.name} ({workspace.role})
                </option>
              {/each}
            </select>
          </form>
          <a
            class="sc-pill"
            href={resolve("/app/workspace")}
            title="Open workspace settings"
            aria-label="Open workspace settings"
          >
            Manage
          </a>
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
