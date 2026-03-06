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

<div class="sc-section">
  {#if processes.length === 0}
    <div class="sc-card">
      <div class="sc-page-subtitle">
        No processes yet. Start by writing your first process.
      </div>
    </div>
  {:else}
    {#each processes as process}
      <article
        class="sc-card sc-entity-card sc-process-card sc-card-interactive"
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
          class="sc-process-card-clickable-area"
          href={`/app/processes/${process.slug}`}
        >
          <div class="sc-process-card-content">
            <div class="sc-process-card-info">
              <div class="sc-section-title sc-process-card-title-row">
                <span class="sc-portal sc-portal-process">{process.name}</span>
              </div>
              <div class="sc-page-subtitle">
                <RichText html={process.descriptionHtml} />
              </div>
            </div>

            <div class="sc-process-badge-rows">
              <div class="sc-process-badge-row">
                <span class="sc-process-badge-label">Roles</span>
                <div
                  class="sc-process-badges"
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
                  class="sc-process-badges"
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
        </a>
      </article>
    {/each}
  {/if}
</div>

<style>
  .sc-process-card {
    padding: 0;
    position: relative;
  }

  .sc-process-card-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .sc-process-card-clickable-area {
    display: block;
    padding: 16px;
    text-decoration: none;
    color: inherit;
    width: 100%;
  }

  .sc-process-card-clickable-area:hover {
    color: inherit;
  }

  .sc-process-card-content {
    /* Layout handled in app.css but ensuring it works inside the link */
    width: 100%;
  }

  .sc-process-card-title-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
</style>
