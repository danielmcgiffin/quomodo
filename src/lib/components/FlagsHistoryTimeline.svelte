<script lang="ts">
  import { onMount } from "svelte"
  import type { FlagsDashboardEntry } from "$lib/server/app/mappers/flags"

  type TimelineGroup = {
    key: string
    label: string
    railLabel: string
    items: FlagsDashboardEntry[]
  }

  let {
    groups,
    emptyMessage = "No matching history yet.",
  }: {
    groups: TimelineGroup[]
    emptyMessage?: string
  } = $props()

  let activeRailLabel = $state("")
  let groupRefs = new Map<string, HTMLElement>()

  const statusLabelByType: Record<string, string> = {
    resolved: "Resolved",
    dismissed: "Dismissed",
  }

  $effect(() => {
    activeRailLabel = groups[0]?.railLabel ?? ""
  })

  const setGroupRef = (node: HTMLElement, key: string) => {
    groupRefs.set(key, node)
    return {
      destroy() {
        groupRefs.delete(key)
      },
    }
  }

  const getTargetHref = (item: FlagsDashboardEntry) => {
    if (item.targetType === "process" && item.target) {
      return `/app/processes/${item.target.slug}`
    }
    if (item.targetType === "role" && item.target) {
      return `/app/roles/${item.target.slug}`
    }
    if (item.targetType === "system" && item.target) {
      return `/app/systems/${item.target.slug}`
    }
    if (item.targetType === "action" && item.target) {
      return item.target.href
    }
    return item.originHref
  }

  const getTargetLabel = (item: FlagsDashboardEntry) => {
    if (item.targetType === "process" && item.target) return item.target.name
    if (item.targetType === "role" && item.target) return item.target.name
    if (item.targetType === "system" && item.target) return item.target.name
    if (item.targetType === "action" && item.target) return item.target.label
    return item.targetType
  }

  onMount(() => {
    if (groups.length === 0) {
      activeRailLabel = ""
      return
    }

    activeRailLabel = groups[0]?.railLabel ?? ""

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) {
          const matched = groups.find(
            (group) => groupRefs.get(group.key) === visible[0].target,
          )
          if (matched) activeRailLabel = matched.railLabel
        }
      },
      {
        root: null,
        rootMargin: "-22% 0px -58% 0px",
        threshold: [0.15, 0.5, 1],
      },
    )

    for (const group of groups) {
      const node = groupRefs.get(group.key)
      if (node) observer.observe(node)
    }

    return () => observer.disconnect()
  })
</script>

{#if groups.length === 0}
  <div class="sc-card sc-flags-history-empty">{emptyMessage}</div>
{:else}
  <div class="sc-flags-history-layout">
    <aside class="sc-flags-history-rail" aria-hidden="true">
      <div class="sc-flags-history-rail-sticky">
        <div class="sc-flags-history-rail-label">{activeRailLabel}</div>
      </div>
    </aside>

    <div class="sc-flags-history-stream">
      <div class="sc-flags-history-mobile-label">{activeRailLabel}</div>

      {#each groups as group}
        <section class="sc-flags-history-group" use:setGroupRef={group.key}>
          <h3 class="sc-flags-history-group-title">{group.label}</h3>

          <div class="sc-flags-history-items">
            {#each group.items as item}
              <article class="sc-card sc-card-flag sc-flags-history-item" id={`flag-${item.id}`}>
                <div class="sc-flags-history-item-top">
                  <a class="sc-flags-history-message" href={item.originHref}>{item.message}</a>
                  <span class="sc-pill">
                    {statusLabelByType[item.status] ?? item.status}
                  </span>
                </div>

                <div class="sc-flags-history-item-meta">
                  <a class="sc-flags-history-target" href={getTargetHref(item)}>
                    {getTargetLabel(item)}
                  </a>
                  <span>Raised {item.createdAt}</span>
                  {#if item.resolvedAt}
                    <span>{item.resolvedAt}</span>
                  {/if}
                  {#if item.resolvedByLabel}
                    <span>by {item.resolvedByLabel}</span>
                  {/if}
                </div>

                {#if item.resolutionNote}
                  <div class="sc-flags-history-note">“{item.resolutionNote}”</div>
                {/if}
              </article>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  </div>
{/if}

<style>
  .sc-flags-history-layout {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .sc-flags-history-rail-sticky {
    position: sticky;
    top: 84px;
  }

  .sc-flags-history-rail-label {
    color: var(--sc-text-light);
    font-size: var(--sc-font-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .sc-flags-history-mobile-label {
    display: none;
  }

  .sc-flags-history-group + .sc-flags-history-group {
    margin-top: 18px;
  }

  .sc-flags-history-group-title {
    font-size: var(--sc-font-sm);
    text-transform: uppercase;
    color: var(--sc-text-light);
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }

  .sc-flags-history-items {
    display: grid;
    gap: 10px;
  }

  .sc-flags-history-item {
    padding: 12px;
  }

  .sc-flags-history-item-top {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    justify-content: space-between;
  }

  .sc-flags-history-message {
    color: var(--sc-text);
    font-weight: 600;
    text-decoration: none;
  }

  .sc-flags-history-message:hover,
  .sc-flags-history-message:focus-visible,
  .sc-flags-history-target:hover,
  .sc-flags-history-target:focus-visible {
    color: var(--sc-green);
    text-decoration: underline;
  }

  .sc-flags-history-item-meta {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    color: var(--sc-text-muted);
    font-size: var(--sc-font-xs);
  }

  .sc-flags-history-target {
    color: var(--sc-text-muted);
    font-weight: 600;
    text-decoration: none;
  }

  .sc-flags-history-note {
    margin-top: 8px;
    color: var(--sc-text-muted);
    font-size: var(--sc-font-sm);
  }

  @media (max-width: 900px) {
    .sc-flags-history-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .sc-flags-history-rail {
      display: none;
    }

    .sc-flags-history-mobile-label {
      position: sticky;
      top: 64px;
      z-index: 2;
      display: inline-flex;
      align-self: flex-start;
      margin-bottom: 8px;
      border: 1px solid var(--sc-border);
      background: var(--sc-white);
      color: var(--sc-text-light);
      border-radius: var(--sc-radius-full);
      padding: 4px 10px;
      font-size: var(--sc-font-xs);
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
  }
</style>
