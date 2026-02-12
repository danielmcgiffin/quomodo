<script lang="ts">
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"

  type Role = {
    id: string
    slug: string
    name: string
    initials: string
  }
  type System = {
    id: string
    slug: string
    name: string
  }

  let {
    process,
    actionRoles,
    actionSystems,
    viewerRole,
    createFlagError,
    createFlagTargetType,
    createFlagTargetId,
  }: {
    process: { id: string; name: string; trigger: string; endState: string }
    actionRoles: Role[]
    actionSystems: System[]
    viewerRole: "owner" | "admin" | "editor" | "member"
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
  } = $props()
</script>

<div class="sc-section sc-entity-card">
  <InlineEntityFlagControl
    action="?/createFlag"
    targetType="process"
    targetId={process.id}
    entityLabel={process.name}
    {viewerRole}
    errorMessage={createFlagError}
    errorTargetType={createFlagTargetType}
    errorTargetId={createFlagTargetId}
  />
  <div class="sc-process-details-grid">
    <div class="sc-process-facts sc-process-facts--stack">
      <div class="sc-card sc-process-fact">
        <div class="sc-process-fact-label">Trigger</div>
        <div class="sc-process-fact-value">{process.trigger || "Not set"}</div>
      </div>
      <div class="sc-card sc-process-fact">
        <div class="sc-process-fact-label">End State</div>
        <div class="sc-process-fact-value">{process.endState || "Not set"}</div>
      </div>
    </div>
    <div class="sc-process-facts sc-process-facts--stack">
      <div class="sc-card sc-process-fact">
        <div class="sc-process-fact-label">Who Does It</div>
        <div class="sc-byline">
          {#if actionRoles.length === 0}
            <span class="sc-page-subtitle">No action owners yet.</span>
          {:else}
            {#each actionRoles as role}
              <RolePortal {role} />
            {/each}
          {/if}
        </div>
      </div>
      <div class="sc-card sc-process-fact">
        <div class="sc-process-fact-label">What Systems</div>
        <div class="sc-byline">
          {#if actionSystems.length === 0}
            <span class="sc-page-subtitle">No systems linked yet.</span>
          {:else}
            {#each actionSystems as system}
              <SystemPortal {system} />
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
