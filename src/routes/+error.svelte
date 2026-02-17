<script lang="ts">
  import "../app.css"
  import { page } from "$app/stores"
  import { dev } from "$app/environment"
  import { marketingSite } from "$lib/marketing/site"
</script>

<svelte:head>
  <title>Error - {marketingSite.brand}</title>
</svelte:head>

<div class="mk-shell flex flex-col min-h-screen">
  <header class="mk-header">
    <div class="mk-container mk-nav-row">
      <a class="mk-brand" href="/">
        <span class="mk-brand-mark">SC</span>
        <span>
          <strong>{marketingSite.brand}</strong>
        </span>
      </a>
    </div>
  </header>

  <main class="flex-grow flex items-center justify-center px-6 py-12">
    <div class="max-w-2xl w-full text-center">
      <div
        class="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6"
      >
        {$page.status} Error
      </div>

      <h1 class="text-4xl lg:text-6xl font-bold text-white mb-6">
        {#if $page.status === 403}
          Access Restricted
        {:else}
          Systems disruption detected.
        {/if}
      </h1>

      <p class="text-xl text-slate-400 mb-10 leading-relaxed">
        {#if $page.error?.message && $page.error.message !== "Internal Error"}
          {$page.error.message}
        {:else}
          We encountered an unexpected issue while processing your request. Our
          team has been notified, and we're working to restore operational
          clarity.
        {/if}
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/" class="mk-btn mk-btn-primary w-full sm:w-auto px-8">
          Return to Atlas
        </a>
        <a href="/contact" class="mk-btn mk-btn-quiet w-full sm:w-auto px-8">
          Contact Support
        </a>
      </div>

      {#if dev}
        <div class="mt-16 text-left">
          <div
            class="flex items-center gap-2 mb-4 text-accent font-bold uppercase tracking-wider text-xs"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Developer Diagnostics
          </div>
          <div
            class="bg-[#141416] border border-white/10 rounded-xl p-6 shadow-2xl overflow-hidden"
          >
            <div class="font-mono text-sm text-red-400 break-words mb-4">
              <strong>Error:</strong>
              {$page?.error?.message || "Unknown error"}
            </div>
            {#if $page.error && "stack" in $page.error}
              <pre
                class="font-mono text-xs text-slate-500 overflow-auto max-h-64 p-4 bg-black/30 rounded-lg">{$page
                  .error.stack}</pre>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </main>

  <footer class="py-8 text-center text-slate-600 text-sm">
    &copy; {new Date().getFullYear()}
    {marketingSite.brand}. All rights reserved.
  </footer>
</div>

<style>
  /* Ensure the error page takes priority over any layout overflows */
  :global(body) {
    overflow-x: hidden;
  }
</style>
