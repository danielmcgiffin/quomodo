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
    descriptionHtml: string
    ownerRole: Role | null
    system: System | null
  }

  let {
    actions,
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
            <form class="sc-action-order-form" method="POST" action="?/reorderAction">
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
            <form class="sc-action-order-form" method="POST" action="?/reorderAction">
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
</div>
