<script lang="ts">
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import FlagBadgeModal from "$lib/components/FlagBadgeModal.svelte"
  import type { DirectFlagBadgeData, RelatedFlagBadgeData } from "$lib/flags"

  type RoleBadge = { id: string; slug: string; name: string; initials: string }
  type SystemBadge = { id: string; slug: string; name: string }
  type ProcessCard = {
    id: string
    slug: string
    name: string
    descriptionHtml: string
    roleBadges: RoleBadge[]
    systemBadges: SystemBadge[]
    directFlagData: DirectFlagBadgeData
    relatedFlagData: RelatedFlagBadgeData
  }

  let {
    processes,
    viewerRole,
    createFlagError,
    createFlagTargetType,
    createFlagTargetId,
    createFlagTargetPath,
  }: {
    processes: ProcessCard[]
    viewerRole: "owner" | "admin" | "editor" | "member"
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
  } = $props()

  const processFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
    { path: "trigger", label: "Trigger" },
    { path: "end_state", label: "End state" },
    { path: "owner_role_id", label: "Owner role" },
  ]

  let openSummaryKey = $state<string | null>(null)

  const summaryKey = (processId: string, group: "roles" | "systems") =>
    `${processId}:${group}`

  const toggleSummary = (processId: string, group: "roles" | "systems") => {
    const key = summaryKey(processId, group)
    openSummaryKey = openSummaryKey === key ? null : key
  }

  const isSummaryOpen = (processId: string, group: "roles" | "systems") =>
    openSummaryKey === summaryKey(processId, group)
</script>

{#if processes.length === 0}
  <div class="sc-section">
    <div class="sc-card">
      <div class="sc-page-subtitle">
        No processes yet. Start by writing your first process.
      </div>
    </div>
  </div>
{:else}
  <div class="sc-section sc-entity-list-grid">
    {#each processes as process}
      <article
        class="sc-card sc-entity-card sc-card-interactive sc-process-card sc-entity-family-card"
      >
        <a
          class="sc-entity-card-overlay"
          href={`/app/processes/${process.slug}`}
          aria-label={`Open process ${process.name}`}
          tabindex="-1"
        ></a>

        <div class="sc-entity-card-body sc-process-card-body">
          <div class="sc-process-card-title-row">
            <span class="sc-portal sc-portal-process sc-process-card-title">
              {process.name}
            </span>

            <div class="sc-process-card-title-actions">
              <FlagBadgeModal
                kind="direct"
                label={`${process.name} direct flags`}
                data={process.directFlagData}
                {viewerRole}
                modalTitle={`${process.name} flags`}
                modalDescription="Open flags attached directly to this process."
                directOriginHref={`/app/processes/${process.slug}`}
              />
              <FlagBadgeModal
                kind="related"
                label={`${process.name} related flags`}
                data={process.relatedFlagData}
                {viewerRole}
                modalTitle={`${process.name} related flags`}
                modalDescription="Open flags on the visible role and system portals on this card."
              />
              <InlineEntityFlagControl
                inline={true}
                action="?/createFlag"
                targetType="process"
                targetId={process.id}
                entityLabel={process.name}
                {viewerRole}
                fieldTargets={processFieldTargets}
                errorMessage={createFlagError}
                errorTargetType={createFlagTargetType}
                errorTargetId={createFlagTargetId}
                errorTargetPath={createFlagTargetPath}
              />
            </div>
          </div>

          <div class="sc-process-summary-row">
            <div
              class="sc-process-summary-group"
              class:is-open={isSummaryOpen(process.id, "roles")}
            >
              <button
                type="button"
                class="sc-process-summary-trigger"
                aria-expanded={isSummaryOpen(process.id, "roles")}
                onclick={() => toggleSummary(process.id, "roles")}
              >
                <span class="sc-process-summary-label">Roles</span>
                <span class="sc-process-summary-count"
                  >{process.roleBadges.length}</span
                >
              </button>
              <div class="sc-process-summary-popover">
                {#if process.roleBadges.length === 0}
                  <span class="sc-page-subtitle">No roles linked</span>
                {:else}
                  {#each process.roleBadges as role (role.id)}
                    <RolePortal {role} size="sm" />
                  {/each}
                {/if}
              </div>
            </div>

            <div
              class="sc-process-summary-group"
              class:is-open={isSummaryOpen(process.id, "systems")}
            >
              <button
                type="button"
                class="sc-process-summary-trigger"
                aria-expanded={isSummaryOpen(process.id, "systems")}
                onclick={() => toggleSummary(process.id, "systems")}
              >
                <span class="sc-process-summary-label">Systems</span>
                <span class="sc-process-summary-count"
                  >{process.systemBadges.length}</span
                >
              </button>
              <div class="sc-process-summary-popover">
                {#if process.systemBadges.length === 0}
                  <span class="sc-page-subtitle">No systems linked</span>
                {:else}
                  {#each process.systemBadges as system (system.id)}
                    <SystemPortal {system} size="sm" />
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        </div>
      </article>
    {/each}
  </div>
{/if}

<style>
  .sc-process-card-body {
    gap: 10px;
  }

  .sc-process-card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .sc-process-card-title {
    min-width: 0;
    margin: 0;
    font-size: 1.06rem;
    line-height: 1.25;
    font-weight: 700;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .sc-process-card-title-actions {
    position: relative;
    z-index: 6;
    pointer-events: auto;
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .sc-process-summary-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: auto;
    position: relative;
    z-index: 4;
    pointer-events: auto;
  }

  .sc-process-summary-group {
    position: relative;
  }

  .sc-process-summary-trigger {
    border: 1px solid var(--sc-border);
    background: var(--sc-bg-inset);
    color: var(--sc-text);
    border-radius: var(--sc-radius-full);
    padding: 4px 10px;
    font-size: 0.78rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .sc-process-summary-trigger:focus-visible {
    outline: 2px solid var(--sc-green);
    outline-offset: 1px;
  }

  .sc-process-summary-label {
    color: var(--sc-text-muted);
  }

  .sc-process-summary-count {
    color: var(--sc-text);
  }

  .sc-process-summary-popover {
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    min-width: 220px;
    max-width: min(360px, 70vw);
    border: 1px solid var(--sc-border);
    background: var(--sc-white);
    border-radius: var(--sc-radius-md);
    box-shadow: 0 10px 24px rgba(14, 20, 24, 0.14);
    padding: 8px;
    display: none;
    z-index: 10;
    gap: 6px;
    flex-direction: column;
  }

  .sc-process-summary-group:hover .sc-process-summary-popover,
  .sc-process-summary-group:focus-within .sc-process-summary-popover,
  .sc-process-summary-group.is-open .sc-process-summary-popover {
    display: flex;
  }

  @media (max-width: 720px) {
    .sc-process-summary-popover {
      max-width: min(300px, calc(100vw - 48px));
    }
  }
</style>
