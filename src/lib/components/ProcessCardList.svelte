<script lang="ts">
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"

  type RoleBadge = { id: string; slug: string; name: string; initials: string }
  type SystemBadge = { id: string; slug: string; name: string }
  type ProcessCard = {
    id: string
    slug: string
    name: string
    descriptionHtml: string
    roleBadges: RoleBadge[]
    systemBadges: SystemBadge[]
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
      <article class="sc-card sc-entity-card sc-process-card sc-card-interactive">
        <InlineEntityFlagControl
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
        <a class="sc-process-card-link" href={`/app/processes/${process.slug}`}>
          <div class="sc-process-card-content">
            <div class="sc-process-card-info">
              <div class="sc-section-title">
                <span class="sc-portal sc-portal-process">{process.name}</span>
              </div>
              <div class="sc-page-subtitle">
                <RichText html={process.descriptionHtml} />
              </div>
            </div>

            <div class="sc-process-badge-rows">
              <div class="sc-process-badge-row">
                <span class="sc-process-badge-label">Roles</span>
                <div class="sc-process-badges">
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
                <div class="sc-process-badges">
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
