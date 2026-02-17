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
  const isStackMode = $derived($page.url.searchParams.get("stack") === "1")
  let appContentRoot: HTMLElement | null = null
  let stackTarget = $state<{
    href: string
    frameHref: string
    title: string
    kind: "process" | "role" | "system"
  } | null>(null)

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

  const getStackKind = (
    pathname: string,
  ): "process" | "role" | "system" | null => {
    const normalized = pathname.replace(/\/+$/, "")
    if (/^\/app\/processes\/[^/]+$/.test(normalized)) {
      return "process"
    }
    if (/^\/app\/roles\/[^/]+$/.test(normalized)) {
      return "role"
    }
    if (/^\/app\/systems\/[^/]+$/.test(normalized)) {
      return "system"
    }
    return null
  }

  const openStackTarget = ({
    href,
    title,
    kind,
  }: {
    href: string
    title: string
    kind: "process" | "role" | "system"
  }) => {
    const panelUrl = new URL(href, window.location.origin)
    panelUrl.searchParams.set("stack", "1")
    const frameHref = `${panelUrl.pathname}${panelUrl.search}${panelUrl.hash}`

    stackTarget = { href, frameHref, title, kind }
    if (typeof window !== "undefined") {
      window.history.pushState(
        {
          scStack: true,
          scStackHref: href,
          scStackFrameHref: frameHref,
          scStackTitle: title,
          scStackKind: kind,
        },
        "",
        href,
      )
    }
  }

  const closeStackTarget = () => {
    if (typeof window !== "undefined" && window.history.state?.scStack) {
      window.history.back()
      return
    }
    stackTarget = null
  }

  const onWindowPopState = (event: PopStateEvent) => {
    const state = event.state as {
      scStack?: boolean
      scStackHref?: string
      scStackFrameHref?: string
      scStackTitle?: string
      scStackKind?: "process" | "role" | "system"
    } | null
    if (
      state?.scStack &&
      typeof state.scStackHref === "string" &&
      (state.scStackKind === "process" ||
        state.scStackKind === "role" ||
        state.scStackKind === "system")
    ) {
      stackTarget = {
        href: state.scStackHref,
        frameHref:
          state.scStackFrameHref ||
          (() => {
            const panelUrl = new URL(state.scStackHref, window.location.origin)
            panelUrl.searchParams.set("stack", "1")
            return `${panelUrl.pathname}${panelUrl.search}${panelUrl.hash}`
          })(),
        title: state.scStackTitle || "Details",
        kind: state.scStackKind,
      }
      return
    }
    stackTarget = null
  }

  const onDocumentClick = (event: MouseEvent) => {
    if (isStackMode || !(event.target instanceof Element) || !appContentRoot) {
      return
    }
    const anchor = event.target.closest("a") as HTMLAnchorElement | null
    if (!anchor || !appContentRoot.contains(anchor)) {
      return
    }
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      anchor.target === "_blank" ||
      anchor.hasAttribute("download")
    ) {
      return
    }

    const rawHref = anchor.getAttribute("href")?.trim()
    if (!rawHref || rawHref.startsWith("#")) {
      return
    }

    const url = new URL(anchor.href, window.location.origin)
    if (url.origin !== window.location.origin) {
      return
    }

    const kind = getStackKind(url.pathname)
    if (!kind) {
      return
    }

    event.preventDefault()
    const href = `${url.pathname}${url.search}${url.hash}`
    const title =
      anchor.getAttribute("aria-label")?.trim() ||
      anchor.querySelector(".sc-portal-name")?.textContent?.trim() ||
      anchor.textContent?.trim() ||
      "Details"
    openStackTarget({ href, title, kind })
  }
</script>

<svelte:window onkeydown={onWindowKeydown} onpopstate={onWindowPopState} />
<svelte:document onclickcapture={onDocumentClick} />

<div class="sc-app sc-shell" class:is-mobile-menu-open={isMobileMenuOpen}>
  {#if !isStackMode}
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
  {/if}

  {#if !isStackMode && isMobileMenuOpen}
    <button
      class="sc-sidebar-overlay"
      onclick={() => (isMobileMenuOpen = false)}
      onkeydown={(event) => {
        if (
          event.key === "Escape" ||
          event.key === "Enter" ||
          event.key === " "
        ) {
          isMobileMenuOpen = false
        }
      }}
      aria-label="Close menu"
    ></button>
  {/if}

  {#if !isStackMode}
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
  {/if}

  <div class="sc-main">
    {#if !isStackMode}
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
    {/if}

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

    <div bind:this={appContentRoot}>
      {@render children?.()}
    </div>

    {#if stackTarget}
      <button
        class="sc-shell-stack-overlay"
        type="button"
        aria-label="Close details panel"
        onclick={closeStackTarget}
      ></button>
      <aside class="sc-shell-stack-panel" aria-label="Stack navigation panel">
        <div class="sc-shell-stack-head">
          <button
            class="sc-btn secondary"
            type="button"
            onclick={closeStackTarget}
          >
            Back
          </button>
          <div class="sc-shell-stack-title">
            {stackTarget.kind === "process"
              ? "Process"
              : stackTarget.kind === "role"
                ? "Role"
                : "System"}: {stackTarget.title}
          </div>
          <a class="sc-btn secondary sc-shell-stack-go" href={stackTarget.href}>
            Go to
          </a>
        </div>
        <iframe
          class="sc-shell-stack-frame"
          src={stackTarget.frameHref}
          title={stackTarget.title}
        ></iframe>
      </aside>
    {/if}

    {#if !isStackMode}
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
    {/if}
  </div>
</div>

<style>
  .sc-shell-stack-overlay {
    position: fixed;
    inset: 0;
    z-index: 70;
    border: 0;
    background: rgba(16, 12, 10, 0.34);
  }

  .sc-shell-stack-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(960px, 92vw);
    z-index: 80;
    background: var(--sc-bg);
    border-left: 1px solid var(--sc-border);
    box-shadow: -16px 0 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    animation: sc-shell-stack-in 180ms ease-out;
  }

  .sc-shell-stack-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--sc-border);
    background: var(--sc-white);
  }

  .sc-shell-stack-title {
    min-width: 0;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sc-shell-stack-go {
    margin-left: auto;
  }

  .sc-shell-stack-frame {
    width: 100%;
    height: 100%;
    border: 0;
    background: var(--sc-bg);
  }

  @keyframes sc-shell-stack-in {
    from {
      transform: translateX(20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
