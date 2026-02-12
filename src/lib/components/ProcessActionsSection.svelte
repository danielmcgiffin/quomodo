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
    createFlagError,
    createFlagTargetType,
    createFlagTargetId,
    onCreateAction,
    onEditAction,
    onActionKeydown,
  }: {
    actions: ActionEntry[]
    viewerRole: "owner" | "admin" | "editor" | "member"
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    onCreateAction: () => void
    onEditAction: (event: MouseEvent, action: ActionEntry) => void
    onActionKeydown: (event: KeyboardEvent, action: ActionEntry) => void
  } = $props()
</script>

<div class="sc-section">
  <div class="flex justify-between items-center gap-4 flex-wrap">
    <div class="sc-section-title">What Happens?</div>
    <button class="sc-btn mb-2" type="button" onclick={onCreateAction}>
      Write an Action
    </button>
  </div>
  {#each actions as action}
    <div
      class="sc-card sc-entity-card sc-action-card sc-action-card-clickable"
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
        errorMessage={createFlagError}
        errorTargetType={createFlagTargetType}
        errorTargetId={createFlagTargetId}
      />
      <div class="sc-action-card-main">
        <div style="font-size: var(--sc-font-lg); font-weight: 600; margin-top:6px;">
          <RichText html={action.descriptionHtml} />
        </div>
      </div>
      <div class="sc-action-card-side">
        <div class="sc-action-sequence">{action.sequence}</div>
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
