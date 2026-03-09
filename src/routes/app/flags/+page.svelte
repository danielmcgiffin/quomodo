<script lang="ts">
  import FlagsCreateForm from "$lib/components/FlagsCreateForm.svelte"
  import FlagsCardList from "$lib/components/FlagsCardList.svelte"
  import FlagsHistoryTimeline from "$lib/components/FlagsHistoryTimeline.svelte"
  import type { FlagsDashboardEntry } from "$lib/server/app/mappers/flags"

  type TimelineGroup = {
    key: string
    label: string
    railLabel: string
    items: FlagsDashboardEntry[]
  }

  type Props = {
    data: {
      viewerRole: "owner" | "admin" | "editor" | "member"
      targetOptions: { value: string; label: string }[]
      flags: FlagsDashboardEntry[]
      resolvedHistory: FlagsDashboardEntry[]
      historyTimeline?: TimelineGroup[]
      filters: {
        status?: "open" | "resolved" | "dismissed"
        targetType?: "process" | "role" | "system" | "action" | null
        targetId?: string | null
        view?: "open" | "history"
        historyStatus?: "all" | "resolved" | "dismissed"
        q?: string
      }
    }
    form?: {
      createFlagError?: string
      resolveFlagError?: string
      dismissFlagError?: string
      deleteFlagError?: string
    }
  }

  let { data, form }: Props = $props()

  const canModerate = $derived.by(() =>
    ["owner", "admin", "editor"].includes(data.viewerRole),
  )

  const currentView = $derived.by(() => {
    if (data.filters.view === "open" || data.filters.view === "history") {
      return data.filters.view
    }
    return data.filters.status === "open" ? "open" : "history"
  })

  const currentHistoryStatus = $derived.by(() => {
    if (
      data.filters.historyStatus === "all" ||
      data.filters.historyStatus === "resolved" ||
      data.filters.historyStatus === "dismissed"
    ) {
      return data.filters.historyStatus
    }
    if (data.filters.status === "resolved" || data.filters.status === "dismissed") {
      return data.filters.status
    }
    return "all"
  })

  const currentQuery = $derived(data.filters.q ?? "")

  const applyTargetScope = (params: URLSearchParams) => {
    if (data.filters.targetType) params.set("targetType", data.filters.targetType)
    if (data.filters.targetId) params.set("targetId", data.filters.targetId)
  }

  const tabHref = (view: "open" | "history") => {
    const params = new URLSearchParams()
    params.set("view", view)
    applyTargetScope(params)

    if (view === "open") {
      params.set("status", "open")
    } else {
      params.set("historyStatus", currentHistoryStatus)
      if (currentQuery) params.set("q", currentQuery)
    }

    return `/app/flags?${params.toString()}`
  }

  const statusHref = (status: "all" | "resolved" | "dismissed") => {
    const params = new URLSearchParams()
    params.set("view", "history")
    params.set("historyStatus", status)
    applyTargetScope(params)
    if (currentQuery) params.set("q", currentQuery)
    return `/app/flags?${params.toString()}`
  }

  const clearSearchHref = () => {
    const params = new URLSearchParams()
    params.set("view", "history")
    params.set("historyStatus", currentHistoryStatus)
    applyTargetScope(params)
    return `/app/flags?${params.toString()}`
  }

  const parseDate = (value: string | null) => {
    if (!value) return null
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d
  }

  const buildFallbackTimeline = (items: FlagsDashboardEntry[]): TimelineGroup[] => {
    const byDay = new Map<string, FlagsDashboardEntry[]>()

    for (const item of items) {
      const date = parseDate(item.resolvedAt) ?? parseDate(item.createdAt)
      if (!date) continue
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      byDay.set(key, [...(byDay.get(key) ?? []), item])
    }

    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([key, dayItems]) => {
        const d = new Date(`${key}T00:00:00`)
        return {
          key,
          label: d.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          railLabel: d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          items: dayItems,
        }
      })
  }

  const historyTimeline = $derived.by(() => {
    if (Array.isArray(data.historyTimeline) && data.historyTimeline.length > 0) {
      return data.historyTimeline
    }
    return buildFallbackTimeline(data.resolvedHistory ?? [])
  })
</script>

<svelte:head>
  <title>Flags</title>
</svelte:head>

<div class="sc-process-page">
  <div class="grid grid-cols-1 md:grid-cols-4 items-center gap-4 mb-8">
    <div class="md:col-span-3">
      <div class="sc-page-title text-2xl font-bold" style="margin-bottom: 0;">
        Flags
      </div>
      <div class="sc-page-subtitle">
        Maintenance dashboard for rot across the atlas.
      </div>
    </div>

    <div class="flex md:justify-end">
      <FlagsCreateForm
        targetOptions={data.targetOptions}
        createFlagError={form?.createFlagError}
      />
    </div>
  </div>

  <div class="sc-flags-tabs" role="tablist" aria-label="Flags sections">
    <a
      role="tab"
      aria-selected={currentView === "open"}
      class={`sc-flags-tab ${currentView === "open" ? "is-active" : ""}`}
      href={tabHref("open")}
    >
      Open
    </a>
    <a
      role="tab"
      aria-selected={currentView === "history"}
      class={`sc-flags-tab ${currentView === "history" ? "is-active" : ""}`}
      href={tabHref("history")}
    >
      History
    </a>
  </div>

  {#if form?.resolveFlagError || form?.dismissFlagError || form?.deleteFlagError}
    <div class="sc-card sc-stack-top-12 mb-6">
      <div class="sc-form-error">
        {form.resolveFlagError || form.dismissFlagError || form.deleteFlagError}
      </div>
    </div>
  {/if}

  {#if currentView === "open"}
    <div class="sc-page-subtitle sc-stack-top-12">
      Showing open flags
      {#if data.filters.targetType && data.filters.targetId}
        for {data.filters.targetType}.
      {:else}
        across the atlas.
      {/if}
    </div>

    <FlagsCardList flags={data.flags} {canModerate} />
  {:else}
    <form class="sc-flags-history-toolbar" method="GET" action="/app/flags">
      <input type="hidden" name="view" value="history" />
      <input type="hidden" name="historyStatus" value={currentHistoryStatus} />
      {#if data.filters.targetType}
        <input type="hidden" name="targetType" value={data.filters.targetType} />
      {/if}
      {#if data.filters.targetId}
        <input type="hidden" name="targetId" value={data.filters.targetId} />
      {/if}

      <div class="sc-flags-history-search-wrap">
        <input
          class="sc-search sc-field"
          type="search"
          name="q"
          value={currentQuery}
          placeholder="Search messages and resolution notes"
          aria-label="Search history"
        />
        {#if currentQuery}
          <a class="sc-flags-search-clear" href={clearSearchHref()}>Clear</a>
        {/if}
      </div>

      <div class="sc-flags-history-statuses" role="group" aria-label="History status filter">
        <a
          class={`sc-flags-status-chip ${currentHistoryStatus === "all" ? "is-active" : ""}`}
          href={statusHref("all")}
        >All</a
        >
        <a
          class={`sc-flags-status-chip ${currentHistoryStatus === "resolved" ? "is-active" : ""}`}
          href={statusHref("resolved")}
        >Resolved</a
        >
        <a
          class={`sc-flags-status-chip ${currentHistoryStatus === "dismissed" ? "is-active" : ""}`}
          href={statusHref("dismissed")}
        >Dismissed</a
        >
      </div>

      <button class="sc-btn secondary" type="submit">Apply</button>
    </form>

    <div class="sc-stack-top-12">
      <FlagsHistoryTimeline groups={historyTimeline} />
    </div>
  {/if}
</div>
