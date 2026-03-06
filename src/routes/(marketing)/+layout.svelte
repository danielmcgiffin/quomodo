<script lang="ts">
  import "../../app.css"
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { marketingSite } from "$lib/marketing/site"

  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()
  let mobileOpen = $state(false)
  const proxyPrefix = $derived.by(() => {
    const match = $page.url.pathname.match(/^\/proxy\/\d+/)
    return match ? match[0] : ""
  })

  const withProxyPrefix = (href: string): string => {
    if (!href.startsWith("/") || href.startsWith("//")) {
      return href
    }
    return `${proxyPrefix}${href}`
  }

  const navigateInternal = (event: MouseEvent, href: string): void => {
    if (!href.startsWith("/") || href.startsWith("//")) {
      return
    }
    event.preventDefault()
    goto(withProxyPrefix(href))
  }

  const isActive = (href: string, pathname: string): boolean => {
    if (href === "/") {
      return pathname === "/"
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }
</script>

<div class="mk-shell">
  <header class="mk-header">
    <div class="mk-container mk-nav-row">
      <a
        class="mk-brand"
        href={withProxyPrefix("/")}
        aria-label="SystemsCraft home"
      >
        <img
          class="mk-brand-logo"
          src={withProxyPrefix("/images/systemscraft.jpeg")}
          alt=""
          width="100"
          height="100"
        />
        <span class="mk-brand-lockup">
          <strong class="mk-brand-wordmark">{marketingSite.brand}</strong>
          <small>{marketingSite.tagline}</small>
        </span>
      </a>

      <nav class="mk-nav-desktop" aria-label="Primary">
        {#each marketingSite.nav as item}
          <a
            class={`mk-nav-link ${isActive(item.href, $page.url.pathname) ? "is-active" : ""}`}
            href={withProxyPrefix(item.href)}
            onclick={(event) => navigateInternal(event, item.href)}
          >
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="mk-nav-actions">
        <a
          class="mk-btn mk-btn-quiet"
          href={withProxyPrefix(marketingSite.secondaryCta.href)}
          onclick={(event) =>
            navigateInternal(event, marketingSite.secondaryCta.href)}
        >
          {marketingSite.secondaryCta.label}
        </a>
        <a
          class="mk-btn mk-btn-primary"
          href={withProxyPrefix(marketingSite.primaryCta.href)}
          onclick={(event) =>
            navigateInternal(event, marketingSite.primaryCta.href)}
        >
          {marketingSite.primaryCta.label}
        </a>
        <button
          class="mk-menu-btn"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onclick={() => (mobileOpen = !mobileOpen)}
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </div>
    </div>

    {#if mobileOpen}
      <div class="mk-mobile-nav mk-container" aria-label="Mobile primary">
        {#each marketingSite.nav as item}
          <a
            class="mk-mobile-link"
            href={withProxyPrefix(item.href)}
            onclick={(event) => {
              navigateInternal(event, item.href)
              mobileOpen = false
            }}>{item.label}</a
          >
        {/each}
        <a
          class="mk-mobile-link"
          href={withProxyPrefix(marketingSite.primaryCta.href)}
          onclick={(event) => {
            navigateInternal(event, marketingSite.primaryCta.href)
            mobileOpen = false
          }}
        >
          {marketingSite.primaryCta.label}
        </a>
      </div>
    {/if}
  </header>

  <main class="mk-main">
    <div class="mk-container">
      {@render children?.()}
    </div>
  </main>

  <footer class="mk-footer">
    <div class="mk-container mk-footer-grid">
      <div>
        <div class="mk-footer-brand">{marketingSite.brand}</div>
        <p class="mk-footer-copy">{marketingSite.footer.tagline}</p>
      </div>

      <nav class="mk-footer-links" aria-label="Footer">
        {#each marketingSite.footerLinks as item}
          <a
            href={withProxyPrefix(item.href)}
            onclick={(event) => navigateInternal(event, item.href)}
            >{item.label}</a
          >
        {/each}
      </nav>
    </div>
  </footer>
</div>
