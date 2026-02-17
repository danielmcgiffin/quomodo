<script lang="ts">
  import { dndzone, TRIGGERS } from "svelte-dnd-action"
  import { flip } from "svelte/animate"
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

  let items = $state<ActionEntry[]>([])
  let dragInProgress = false
  $effect(() => {
    // Keep internal items in sync with prop when not dragging
    if (!dragInProgress) {
      items = [...actions]
    }
  })

  let orderFormElement: HTMLFormElement | null = $state(null)
  let orderedIdsValue = $state("")

  function handleDndConsider(e: CustomEvent<DndEvent<ActionEntry>>) {
    const { items: newItems } = e.detail
    items = newItems
    dragInProgress = true
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<ActionEntry>>) {
    const { items: newItems, info } = e.detail
    items = newItems
    dragInProgress = false

    if (info.trigger === TRIGGERS.DRAG_STOPPED) {
      const newIds = newItems.map((i) => i.id).join(",")
      const oldIds = actions.map((i) => i.id).join(",")
      if (newIds !== oldIds) {
        orderedIdsValue = newIds
        // Use requestAnimationFrame to ensure form value is updated before submit
        requestAnimationFrame(() => {
          orderFormElement?.requestSubmit()
        })
      }
    }
  }

  const flipDurationMs = 200
  const canReorder = $derived(
    viewerRole !== "member" && !selectedRoleId && !selectedSystemId,
  )
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

  <form
    method="POST"
    action="?/updateActionOrder"
    bind:this={orderFormElement}
    class="hidden"
  >
    <input type="hidden" name="action_ids" value={orderedIdsValue} />
  </form>

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
    {#if canReorder}
      <span class="ml-2 text-xs italic opacity-70"
        >Drag step numbers to reorder</span
      >
    {/if}
  </div>

  {#if items.length === 0}
    <div class="sc-card sc-stack-top-8">
      <div class="sc-page-subtitle">No actions match the selected filters.</div>
    </div>
  {:else}
    <div
      use:dndzone={{
        items,
        flipDurationMs,
        dragDisabled: !canReorder,
        handleSelector: ".sc-action-sequence",
      }}
      onconsider={handleDndConsider}
      onfinalize={handleDndFinalize}
      class="sc-stack-top-8"
    >
      {#each items as action, index (action.id)}
        <div
          animate:flip={{ duration: flipDurationMs }}
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
            entityLabel={action.title}
            {viewerRole}
            fieldTargets={actionFieldTargets}
            errorMessage={createFlagError}
            errorTargetType={createFlagTargetType}
            errorTargetId={createFlagTargetId}
            errorTargetPath={createFlagTargetPath}
          />
          <div class="sc-action-card-main">
            <div class="font-bold text-lg mb-1">{action.title}</div>
            <div class="sc-action-description">
              <RichText html={action.descriptionHtml} />
            </div>
          </div>
          <div class="sc-action-card-side">
            <div class="sc-action-sequence">{index + 1}</div>
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
  {/if}
</div>
