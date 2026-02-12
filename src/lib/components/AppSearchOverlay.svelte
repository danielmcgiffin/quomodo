<script lang="ts">
  import { goto } from "$app/navigation"
  import { tick } from "svelte"
  import ScModal from "$lib/components/ScModal.svelte"

  type SearchResult = {
    id: string
    type: "role" | "system" | "process" | "action"
    title: string
    snippet: string
    href: string
  }

  let { open = $bindable(false) }: { open?: boolean } = $props()

  let query = $state("")
  let results = $state<SearchResult[]>([])
  let loading = $state(false)
  let errorMessage = $state("")
  let queryInput: HTMLInputElement | null = null
  let requestVersion = 0
  let activeController: AbortController | null = null

  const clearSearchState = () => {
    query = ""
    results = []
    loading = false
    errorMessage = ""
    activeController?.abort()
    activeController = null
  }

  const onResultClick = async (event: MouseEvent, href: string) => {
    event.preventDefault()
    open = false
    await goto(href)
  }

  $effect(() => {
    if (open) {
      tick().then(() => {
        queryInput?.focus()
      })
      return
    }

    clearSearchState()
  })

  $effect(() => {
    const normalized = query.trim()

    activeController?.abort()
    activeController = null
    errorMessage = ""

    if (!open || normalized.length < 2) {
      results = []
      loading = false
      return
    }

    const currentVersion = requestVersion + 1
    requestVersion = currentVersion
    const controller = new AbortController()
    activeController = controller
    loading = true

    fetch(`/app/search?q=${encodeURIComponent(normalized)}&limit=12`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`)
        }
        return (await response.json()) as { results?: SearchResult[] }
      })
      .then((payload) => {
        if (currentVersion !== requestVersion) {
          return
        }
        results = payload.results ?? []
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }
        console.error("Search request failed", error)
        results = []
        errorMessage = "Search is unavailable right now."
      })
      .finally(() => {
        if (currentVersion === requestVersion) {
          loading = false
        }
      })
  })
</script>

<ScModal
  bind:open
  title="Search"
  description="Find roles, systems, processes, and actions."
  maxWidth="760px"
>
  <div class="sc-form-row">
    <input
      bind:this={queryInput}
      class="sc-search sc-field"
      type="text"
      bind:value={query}
      placeholder="Search roles, systems, processes, and actions"
      aria-label="Search"
    />
  </div>

  {#if loading}
    <div class="sc-page-subtitle sc-stack-top-8">Searching...</div>
  {/if}

  {#if errorMessage}
    <div class="sc-form-error sc-stack-top-8">{errorMessage}</div>
  {/if}

  {#if !loading && !errorMessage && query.trim().length >= 2 && results.length === 0}
    <div class="sc-page-subtitle sc-stack-top-8">No matches found.</div>
  {/if}

  {#if results.length > 0}
    <div class="sc-section sc-search-results">
      {#each results as result (`${result.type}:${result.id}`)}
        <a
          class="sc-card sc-card-interactive sc-search-result"
          href={result.href}
          onclick={(event) => onResultClick(event, result.href)}
        >
          <div class="sc-byline">
            <span class="sc-pill sc-search-type-pill">{result.type}</span>
          </div>
          <div class="sc-search-result-title">{result.title}</div>
          <div class="sc-page-subtitle sc-stack-top-6">{result.snippet}</div>
        </a>
      {/each}
    </div>
  {/if}
</ScModal>
