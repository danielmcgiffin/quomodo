<script lang="ts">
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
      billing?: {
        planId: string
        billingState: "active" | "lapsed"
        isLapsed: boolean
        hasEverPaid: boolean
      }
      workspaceOptions: {
        id: string
        name: string
        role: "owner" | "admin" | "editor" | "member"
      }[]
    }
    children?: import("svelte").Snippet
  }

  let { data, children }: Props = $props()
  let isSearchOpen = $state(false)
  let isMobileMenuOpen = $state(false)

  type NavHref =
    | "/app/processes"
    | "/app/roles"
    | "/app/systems"
    | "/app/flags"
    | "/app/team"
    | "/app/workspace"
    | "/account/settings"

  type NavItem = {
    label: string
    href: NavHref
    count?: number
  }

  const canSeeDirectoryLinks = $derived(
    data.org.role === "owner" || data.org.role === "admin",
  )

  const topNavItems = $derived.by((): NavItem[] => [
    { label: "Flags", href: "/app/flags", count: data.navCounts.flags },
    {
      label: "Processes",
      href: "/app/processes",
      count: data.navCounts.processes,
    },
    { label: "Roles", href: "/app/roles", count: data.navCounts.roles },
    { label: "Systems", href: "/app/systems", count: data.navCounts.systems },
  ])

  const bottomNavItems = $derived.by(() => {
    const items: NavItem[] = []

    if (canSeeDirectoryLinks) {
      items.push({ label: "Workspace", href: "/app/workspace" })
      items.push({ label: "Team", href: "/app/team" })
    }

    items.push({ label: "Account", href: "/account/settings" })
    return items
  })

  const isActiveHref = (href: NavHref) => {
    if (href.startsWith("/account")) {
      return $page.url.pathname.startsWith(resolve("/account"))
    }
    return $page.url.pathname.startsWith(resolve(href))
  }

  const onWindowKeydown = (event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      !event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
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

<div class="sc-app sc-shell" class:is-mobile-menu-open={isMobileMenuOpen}>
  <header class="sc-mobile-header">
    <button
      class="sc-hamburger"
      type="button"
      onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
      aria-label="Toggle menu"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
      >
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>

    <a class="sc-mobile-logo" href={resolve("/app/processes")}>
      <img
        src="/images/quaestor-full.png"
        alt="Quaestor"
        style="max-width: 120px; height: auto; display: block;"
      />
    </a>

    <div class="sc-mobile-actions">
      {#if data.workspaceOptions.length > 1}
        <form
          method="POST"
          action={`${resolve("/app/workspace")}?/switchWorkspace`}
        >
          <input
            type="hidden"
            name="redirectTo"
            value={$page.url.pathname + $page.url.search}
          />
          <select
            class="sc-search sc-field text-xs p-1 h-8"
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
                {workspace.name.substring(0, 10)}...
              </option>
            {/each}
          </select>
        </form>
      {/if}
    </div>
  </header>

  {#if isMobileMenuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="sc-sidebar-overlay"
      onclick={() => (isMobileMenuOpen = false)}
    ></div>
  {/if}

  <aside class="sc-sidebar">
    <div class="sc-sidebar-inner">
      <a class="sc-sidebar-brand" href={resolve("/app/processes")}>
        <span class="sc-sidebar-brand-pill justify-center">
          <img
            src="/images/quaestor-full.png"
            alt="Quaestor"
            style="max-width: 180px; height: auto; display: block;"
          />
        </span>
      </a>

      <nav class="sc-sidebar-nav" aria-label="Primary">
        {#each topNavItems as item (item.href)}
          <a
            class={`sc-side-link ${isActiveHref(item.href) ? "is-active" : ""}`}
            href={resolve(item.href)}
            aria-current={isActiveHref(item.href) ? "page" : undefined}
          >
            <span class="sc-side-label">{item.label}</span>
            {#if typeof item.count === "number"}
              <span class="sc-side-count">{item.count}</span>
            {/if}
          </a>
        {/each}
      </nav>

      <nav class="sc-sidebar-footer" aria-label="Workspace and account">
        {#each bottomNavItems as item (item.href)}
          <a
            class={`sc-side-link ${isActiveHref(item.href) ? "is-active" : ""}`}
            href={resolve(item.href)}
            aria-current={isActiveHref(item.href) ? "page" : undefined}
          >
            <span class="sc-side-label">{item.label}</span>
          </a>
        {/each}
      </nav>
    </div>
  </aside>

  <div class="sc-main">
    <header class="sc-topbar">
      <div class="sc-topbar-inner">
        <div class="sc-topbar-search">
          <button
            class="sc-searchbar"
            type="button"
            onclick={() => {
              isSearchOpen = true
            }}
          >
            <span class="sc-searchbar-placeholder align-center">Search</span>
            <span class="sc-searchbar-hint">Ctrl-?</span>
          </button>
        </div>
        <div class="sc-topbar-actions">
          {#if data.workspaceOptions.length > 1}
            <form
              class="sc-topbar-workspace"
              method="POST"
              action={`${resolve("/app/workspace")}?/switchWorkspace`}
            >
              <input
                type="hidden"
                name="redirectTo"
                value={$page.url.pathname + $page.url.search}
              />
              <label class="sr-only" for="sc-topbar-workspace">
                Switch workspace
              </label>
              <select
                id="sc-topbar-workspace"
                class="sc-search sc-field"
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
          {/if}
        </div>
      </div>
    </header>

    {#if data.billing?.isLapsed}
      <div class="sc-banner-shell">
        <div class="sc-banner sc-banner--warning">
          <div>
            This workspace is in read-only mode because billing has lapsed.
          </div>
          <a class="link" href={resolve("/account/billing")}
            >Reactivate billing</a
          >
        </div>
      </div>
    {/if}

    {@render children?.()}

    <button
      class="sc-floating-search"
      type="button"
      onclick={() => (isSearchOpen = true)}
      aria-label="Open search"
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        stroke="currentColor"
        stroke-width="2"
        fill="none"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>

    <AppSearchOverlay bind:open={isSearchOpen} />
  </div>
</div>
