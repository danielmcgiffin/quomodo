<script lang="ts">
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import RichText from "$lib/components/RichText.svelte"
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
  type ActionEntry = {
    id: string
    sequence: number
    descriptionRich: string
    descriptionHtml: string
    ownerRole: Role | null
    system: System | null
  }

  let {
    actions,
    actionRoles = [],
    actionSystems = [],
    selectedRoleId = $bindable(""),
    selectedSystemId = $bindable(""),
    totalActions = 0,
    viewerRole,
    highlightedActionId = null,
    createFlagError,
    createFlagTargetType,
    createFlagTargetId,
    createFlagTargetPath,
    reorderActionError,
    onCreateAction,
    onEditAction,
    onActionKeydown,
  }: {
    actions: ActionEntry[]
    actionRoles?: Role[]
    actionSystems?: System[]
    selectedRoleId?: string
    selectedSystemId?: string
    totalActions?: number
    viewerRole: "owner" | "admin" | "editor" | "member"
    highlightedActionId?: string | null
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
    reorderActionError?: string
    onCreateAction: () => void
    onEditAction: (event: MouseEvent, action: ActionEntry) => void
    onActionKeydown: (event: KeyboardEvent, action: ActionEntry) => void
  } = $props()

  const actionFieldTargets = [
    { path: "description", label: "Description" },
    { path: "owner_role_id", label: "Owner role" },
    { path: "system_id", label: "System" },
    { path: "sequence", label: "Sequence" },
  ]

  const visibleActionCount = $derived(actions.length)
</script>

<div class="sc-section">
  <div class="flex justify-between items-center gap-4 flex-wrap">
    <div class="sc-section-title">What Happens?</div>
    <button class="sc-btn mb-2" type="button" onclick={onCreateAction}>
      Write an Action
    </button>
  </div>
  {#if reorderActionError}
    <div class="sc-form-error-block">{reorderActionError}</div>
  {/if}
  <div class="sc-form-row sc-stack-top-8">
    <select class="sc-search sc-field" bind:value={selectedRoleId}>
      <option value="">All roles</option>
      {#each actionRoles as role}
        <option value={role.id}>{role.name}</option>
      {/each}
    </select>
    <select class="sc-search sc-field" bind:value={selectedSystemId}>
      <option value="">All systems</option>
      {#each actionSystems as system}
        <option value={system.id}>{system.name}</option>
      {/each}
    </select>
  </div>
  <div class="sc-page-subtitle sc-stack-top-8">
    Showing {visibleActionCount} of {totalActions} actions.
  </div>

  {#if actions.length === 0}
    <div class="sc-card sc-stack-top-8">
      <div class="sc-page-subtitle">No actions match the selected filters.</div>
    </div>
  {:else}
    {#each actions as action, index}
      <div
        class="sc-card sc-entity-card sc-action-card sc-action-card-clickable"
        class:is-highlighted={action.id === highlightedActionId}
        role="button"
        tabindex="0"
        aria-label={`Edit Action ${action.sequence}`}
        onclick={(event) => onEditAction(event, action)}
        onkeydown={(event) => onActionKeydown(event, action)}
      >
        <InlineEntityFlagControl
          action="?/createFlag"
          targetType="action"
          targetId={action.id}
          entityLabel={`Action ${action.sequence}`}
          {viewerRole}
          fieldTargets={actionFieldTargets}
          errorMessage={createFlagError}
          errorTargetType={createFlagTargetType}
          errorTargetId={createFlagTargetId}
          errorTargetPath={createFlagTargetPath}
        />
        <div class="sc-action-card-main">
          <div class="sc-action-description">
            <RichText html={action.descriptionHtml} />
          </div>
        </div>
        <div class="sc-action-card-side">
          <div class="sc-action-sequence">{action.sequence}</div>
          {#if viewerRole !== "member"}
            <div class="sc-action-order-controls">
              <form
                class="sc-action-order-form"
                method="POST"
                action="?/reorderAction"
              >
                <input type="hidden" name="action_id" value={action.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  class="sc-action-order-btn"
                  type="submit"
                  aria-label={`Move Action ${action.sequence} up`}
                  disabled={index === 0}
                >
                  ↑
                </button>
              </form>
              <form
                class="sc-action-order-form"
                method="POST"
                action="?/reorderAction"
              >
                <input type="hidden" name="action_id" value={action.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  class="sc-action-order-btn"
                  type="submit"
                  aria-label={`Move Action ${action.sequence} down`}
                  disabled={index === actions.length - 1}
                >
                  ↓
                </button>
              </form>
            </div>
          {/if}
          <div class="sc-action-side-row">
            {#if action.ownerRole}
              <RolePortal role={action.ownerRole} />
            {:else}
              <span class="sc-page-subtitle">No owner</span>
            {/if}
          </div>
          <div class="sc-action-side-row">
            {#if action.system}
              <SystemPortal system={action.system} />
            {:else}
              <span class="sc-page-subtitle">No system</span>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>
