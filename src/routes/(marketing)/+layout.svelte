<script lang="ts">
  import "../../app.css"
  import { page } from "$app/stores"
  import { marketingSite } from "$lib/marketing/site"

  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()
  let mobileOpen = $state(false)
</script>

<div class="mk-shell">
  <header class="mk-header">
    <div class="mk-container mk-nav-row">
      <a class="mk-brand" href="/">
        <span class="mk-brand-mark">SC</span>
        <span>
          <strong>{marketingSite.brand}</strong>
          <small>{marketingSite.tagline}</small>
        </span>
      </a>

      <nav class="mk-nav-desktop" aria-label="Primary">
        {#each marketingSite.nav as item}
          <a
            class={`mk-nav-link ${$page.url.pathname === item.href ? "is-active" : ""}`}
            href={item.href}
          >
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="mk-nav-actions">
        <a class="mk-btn mk-btn-quiet" href={marketingSite.secondaryCta.href} target="_blank" rel="noreferrer">
          {marketingSite.secondaryCta.label}
        </a>
        <a class="mk-btn mk-btn-primary" href={marketingSite.primaryCta.href}>
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
          <a class="mk-mobile-link" href={item.href} onclick={() => (mobileOpen = false)}>{item.label}</a>
        {/each}
        <a class="mk-mobile-link" href={marketingSite.primaryCta.href} onclick={() => (mobileOpen = false)}>
          {marketingSite.primaryCta.label}
        </a>
      </div>
    {/if}
  </header>

  <main class="mk-main mk-container">
    {@render children?.()}
  </main>

  <footer class="mk-footer">
    <div class="mk-container mk-footer-grid">
      <div>
        <div class="mk-footer-brand">SystemsCraft</div>
        <p class="mk-footer-copy">A living operational atlas built for retrieval, ownership, and execution.</p>
      </div>
      <nav class="mk-footer-links" aria-label="Footer">
        {#each marketingSite.footerLinks as item}
          <a href={item.href}>{item.label}</a>
        {/each}
      </nav>
    </div>
  </footer>
</div>
