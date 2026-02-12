<script lang="ts">
  import { afterNavigate } from "$app/navigation"
  import { tick } from "svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"

  type SearchPortalProcess = {
    slug: string
    name: string
  }

  type SearchPortalRole = {
    slug: string
    name: string
    initials: string
  }

  type SearchPortalSystem = {
    slug: string
    name: string
  }

  type SearchResult = {
    id: string
    type: "role" | "system" | "process" | "action"
    title: string
    snippet: string
    href: string
    actionSequence: number | null
    portalProcess: SearchPortalProcess | null
    portalRole: SearchPortalRole | null
    portalSystem: SearchPortalSystem | null
    contextProcess: SearchPortalProcess | null
    contextRole: SearchPortalRole | null
    contextSystem: SearchPortalSystem | null
  }

  let { open = $bindable(false) }: { open?: boolean } = $props()

  let query = $state("")
  let results = $state<SearchResult[]>([])
  let loading = $state(false)
  let errorMessage = $state("")
  let queryInput: HTMLInputElement | null = null
  let requestVersion = 0
  let activeController: AbortController | null = null

  const searchTypeOrder: SearchResult["type"][] = [
    "process",
    "role",
    "system",
    "action",
  ]
  const searchTypeLabel: Record<SearchResult["type"], string> = {
    process: "Processes",
    role: "Roles",
    system: "Systems",
    action: "Actions",
  }

  const groupedResults = $derived.by(() =>
    searchTypeOrder
      .map((type) => ({
        type,
        label: searchTypeLabel[type],
        items: results.filter((result) => result.type === type),
      }))
      .filter((group) => group.items.length > 0),
  )

  const clearSearchState = () => {
    query = ""
    results = []
    loading = false
    errorMessage = ""
    activeController?.abort()
    activeController = null
  }

  afterNavigate(() => {
    if (open) {
      open = false
    }
  })

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

  {#if groupedResults.length > 0}
    <div class="sc-section sc-search-results">
      {#each groupedResults as group (group.type)}
        <div class="sc-search-group">
          <div class="sc-meta sc-search-group-title">{group.label}</div>
          {#each group.items as result (`${result.type}:${result.id}`)}
            <div class="sc-card sc-search-result">
              <div class="sc-byline">
                <span class="sc-pill sc-search-type-pill">{result.type}</span>
              </div>
              <div class="sc-search-result-title">
                {#if result.type === "process" && result.portalProcess}
                  <ProcessPortal process={result.portalProcess} />
                {:else if result.type === "role" && result.portalRole}
                  <RolePortal role={result.portalRole} />
                {:else if result.type === "system" && result.portalSystem}
                  <SystemPortal system={result.portalSystem} />
                {:else if result.type === "action" && result.portalProcess}
                  <div class="sc-byline">
                    <ProcessPortal
                      process={result.portalProcess}
                      query={`actionId=${result.id}`}
                    />
                    {#if result.actionSequence !== null}
                      <span class="sc-pill">Action {result.actionSequence}</span
                      >
                    {/if}
                  </div>
                {:else}
                  <a class="sc-portal sc-portal-process" href={result.href}>
                    <span class="sc-portal-name">{result.title}</span>
                  </a>
                {/if}
              </div>
              {#if result.contextProcess || result.contextRole || result.contextSystem}
                <div class="sc-byline sc-stack-top-6">
                  <span class="sc-search-context-label">Linked:</span>
                  {#if result.contextProcess}
                    <ProcessPortal process={result.contextProcess} />
                  {/if}
                  {#if result.contextRole}
                    <RolePortal role={result.contextRole} size="sm" />
                  {/if}
                  {#if result.contextSystem}
                    <SystemPortal system={result.contextSystem} size="sm" />
                  {/if}
                </div>
              {/if}
              <div class="sc-page-subtitle sc-stack-top-6">
                {result.snippet}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</ScModal>
