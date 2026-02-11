<script lang="ts">
  import { methodSections, methodPath } from "$lib/method";
  import { page } from "$app/stores";

  let { children } = $props();

  const pathname = $derived(() => $page.url.pathname);
  const activeIndex = $derived(() =>
    methodSections.findIndex((section) => pathname === methodPath(section.slug))
  );
  const isOverview = $derived(() => pathname === "/method" || pathname === "/method/");

  let mobileNavOpen = $state(false);

  const currentLabel = $derived(() => {
    if (isOverview) return "Overview";
    if (activeIndex >= 0) return `${activeIndex + 1}. ${methodSections[activeIndex].title}`;
    return "Navigate";
  });
</script>

<div class="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
  <div class="relative">
    <!-- Quieter background for method pages -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute left-1/2 top-[-35%] h-[820px] w-[820px] -translate-x-1/2 rounded-full bg-white/[0.02] blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40"></div>
    </div>

    <section class="relative py-12 md:py-16">
      <div class="mx-auto w-full max-w-7xl px-6">
        <div class="grid gap-10 md:grid-cols-[200px_1fr] md:gap-16">
          <!-- Desktop sidebar — minimal -->
          <aside class="hidden md:block">
            <div class="md:sticky md:top-24">
              <ol class="space-y-1 text-sm">
                <li>
                  <a
                    class={"block px-3 py-1.5 rounded-lg transition-colors duration-200 " + (isOverview ? "text-white font-medium" : "text-[rgb(var(--muted))] hover:text-white")}
                    href="/method"
                  >
                    Overview
                  </a>
                </li>
                {#each methodSections as item, i}
                  <li>
                    <a
                      class={"flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors duration-200 " + (activeIndex === i ? "text-white font-medium" : "text-[rgb(var(--muted))] hover:text-white")}
                      href={methodPath(item.slug)}
                    >
                      <span class="text-xs text-[rgb(var(--muted))]/60 tabular-nums w-4">{String(i + 1).padStart(2, '0')}</span>
                      <span>{item.title}</span>
                    </a>
                  </li>
                {/each}
              </ol>
            </div>
          </aside>

          <div class="method-page space-y-12 text-base md:text-lg max-w-none">
            <!-- Mobile nav — dropdown -->
            <div class="md:hidden">
              <button
                class="flex w-full items-center justify-between rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elev))] px-4 py-3 text-sm text-white"
                onclick={() => mobileNavOpen = !mobileNavOpen}
              >
                <span>{currentLabel}</span>
                <span class="text-[rgb(var(--muted))] transition-transform duration-200" class:rotate-180={mobileNavOpen}>▾</span>
              </button>

              {#if mobileNavOpen}
                <ol class="mt-2 space-y-0.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elev))] p-2">
                  <li>
                    <a
                      class={"block rounded-lg px-3 py-2 text-sm transition-colors " + (isOverview ? "text-white font-medium" : "text-[rgb(var(--muted))]")}
                      href="/method"
                      onclick={() => mobileNavOpen = false}
                    >
                      Overview
                    </a>
                  </li>
                  {#each methodSections as item, i}
                    <li>
                      <a
                        class={"block rounded-lg px-3 py-2 text-sm transition-colors " + (activeIndex === i ? "text-white font-medium" : "text-[rgb(var(--muted))]")}
                        href={methodPath(item.slug)}
                        onclick={() => mobileNavOpen = false}
                      >
                        <span class="text-[rgb(var(--muted))]/60 tabular-nums mr-2">{String(i + 1).padStart(2, '0')}</span>
                        {item.title}
                      </a>
                    </li>
                  {/each}
                </ol>
              {/if}
            </div>

            {@render children()}
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
