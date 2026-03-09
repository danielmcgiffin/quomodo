<script lang="ts">
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import RichText from "$lib/components/RichText.svelte"
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

  function handleActionClick(e: MouseEvent) {
    e.stopPropagation()
  }
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
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="sc-process-card-actions" onclick={handleActionClick}>
          <FlagBadgeModal
            kind="direct"
            label={`${process.name} direct flags`}
            data={process.directFlagData}
            {viewerRole}
            modalTitle={`${process.name} flags`}
            modalDescription="Open flags attached directly to this process."
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

        <a
          class="sc-entity-card-overlay"
          href={`/app/processes/${process.slug}`}
          aria-label={`Open process ${process.name}`}
          tabindex="-1"
        ></a>

        <div class="sc-entity-card-body">
          <div class="sc-entity-card-header">
            <div class="sc-section-title sc-process-card-title-row">
              <span class="sc-portal sc-portal-process">{process.name}</span>
            </div>
          </div>

          <div class="sc-page-subtitle sc-entity-card-summary">
            <RichText html={process.descriptionHtml} />
          </div>

          <div class="sc-process-badge-rows sc-entity-card-meta">
            <div class="sc-process-badge-row">
              <span class="sc-process-badge-label">Roles</span>
              <div
                class="sc-process-badges sc-process-card-badge-cluster"
                style={`--overlap: ${process.roleBadges.length > 3 ? "-10px" : "-4px"}`}
              >
                {#if process.roleBadges.length === 0}
                  <span class="sc-page-subtitle">None</span>
                {:else}
                  {#each process.roleBadges as role}
                    <span class="sc-process-badge" title={role.name}>
                      <RolePortal {role} size="sm" showName={false} />
                    </span>
                  {/each}
                {/if}
              </div>
            </div>

            <div class="sc-process-badge-row">
              <span class="sc-process-badge-label">Systems</span>
              <div
                class="sc-process-badges sc-process-card-badge-cluster"
                style={`--overlap: ${process.systemBadges.length > 3 ? "-10px" : "-4px"}`}
              >
                {#if process.systemBadges.length === 0}
                  <span class="sc-page-subtitle">None</span>
                {:else}
                  {#each process.systemBadges as system}
                    <span class="sc-process-badge" title={system.name}>
                      <SystemPortal {system} size="sm" showName={false} />
                    </span>
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
  .sc-process-card-actions {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
    pointer-events: auto;
  }

  .sc-process-card-badge-cluster {
    position: relative;
    z-index: 3;
    pointer-events: auto;
  }

  .sc-process-card-title-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 0;
  }
</style>
