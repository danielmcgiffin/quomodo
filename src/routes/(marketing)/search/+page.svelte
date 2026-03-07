<script lang="ts">
  // TODO(LP-008): Legacy starter search route retained for now. Keep maintenance-only until SystemsCraft retrieval search replaces it.
  import { page } from "$app/stores"
  import { browser } from "$app/environment"
  import { onMount } from "svelte"
  import Fuse from "fuse.js"
  import { goto } from "$app/navigation"
  import { dev } from "$app/environment"

  const fuseOptions = {
    keys: [
      { name: "title", weight: 3 },
      { name: "description", weight: 2 },
      { name: "body", weight: 1 },
    ],
    ignoreLocation: true,
    threshold: 0.3,
  }

  let fuse: Fuse<Result> | undefined = $state()

  let loading = $state(true)
  let error = $state(false)
  onMount(async () => {
    try {
      const response = await fetch("/search/api.json")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const searchData = await response.json()
      if (searchData && searchData.index && searchData.indexData) {
        const index = Fuse.parseIndex(searchData.index)
        fuse = new Fuse<Result>(searchData.indexData, fuseOptions, index)
      }
    } catch (e) {
      console.error("Failed to load search data", e)
      error = true
    } finally {
      loading = false
      document.getElementById("search-input")?.focus()
    }
  })

  type Result = {
    item: {
      title: string
      description: string
      body: string
      path: string
    }
  }
  let results: Result[] = $state([])

  // searchQuery is $page.url.hash minus the "#" at the beginning if present
  let searchQuery = $state(decodeURIComponent($page.url.hash.slice(1) ?? ""))
  $effect(() => {
    if (fuse) {
      results = fuse.search(searchQuery)
    }
  })
  // Update the URL hash when searchQuery changes so the browser can bookmark/share the search results
  $effect(() => {
    if (browser && window.location.hash.slice(1) !== searchQuery) {
      goto("#" + searchQuery, { keepFocus: true })
    }
  })

  let focusItem = $state(0)
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      searchQuery = ""
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      focusItem += event.key === "ArrowDown" ? 1 : -1
      if (focusItem < 0) {
        focusItem = 0
      } else if (focusItem > results.length) {
        focusItem = results.length
      }
      if (focusItem === 0) {
        document.getElementById("search-input")?.focus()
      } else {
        document.getElementById(`search-result-${focusItem}`)?.focus()
      }
    }
  }
</script>

<svelte:window onkeydown={onKeyDown} />

<svelte:head>
  <title>Search</title>
  <meta name="description" content="Search our website." />
</svelte:head>

<div class="py-12 lg:py-20 px-6 max-w-2xl mx-auto">
  <div class="text-center mb-12">
    <div
      class="text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent inline-block"
    >
      Search
    </div>
  </div>
  <label
    class="input input-bordered flex items-center gap-2 mt-10 mb-10 w-full bg-[#141416] border-white/10 focus-within:border-primary/50 transition-all"
  >
    <input
      id="search-input"
      type="text"
      class="grow w-full text-white"
      placeholder="Search insights and documentation..."
      bind:value={searchQuery}
      onfocus={() => (focusItem = 0)}
      aria-label="Search input"
    />
  </label>

  {#if loading && searchQuery.length > 0}
    <div class="text-center mt-10 text-slate-400 text-xl">Loading...</div>
  {/if}

  {#if error}
    <div class="text-center mt-10 text-red-400 text-xl">
      Error connecting to search. Please try again later.
    </div>
  {/if}

  {#if !loading && searchQuery.length > 0 && results.length === 0 && !error}
    <div class="text-center mt-10 text-slate-400 text-xl">No results found</div>
    {#if dev}
      <div class="text-center mt-4 font-mono text-sm text-slate-500">
        Development mode only message: if you're missing content, rebuild your
        local search index with `npm run build`
      </div>
    {/if}
  {/if}

  <div>
    {#each results as result, i}
      <a
        href={result.item.path || "/"}
        id="search-result-{i + 1}"
        class="block group mb-6"
      >
        <div
          class="card bg-[#141416] border border-white/5 hover:border-primary/30 transition-all shadow-xl flex-row overflow-hidden focus:ring-2 focus:ring-primary outline-hidden"
        >
          <div
            class="flex-none w-2 md:w-4 bg-primary/20 group-hover:bg-primary/40 transition-colors"
          ></div>
          <div class="py-6 px-8">
            <div
              class="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors"
            >
              {result.item.title}
            </div>
            <div
              class="text-xs font-medium text-accent/80 mb-2 uppercase tracking-wider"
            >
              {result.item.path}
            </div>
            <div class="text-slate-400 line-clamp-2">
              {result.item.description}
            </div>
          </div>
        </div>
      </a>
    {/each}
  </div>

  <div></div>
</div>
