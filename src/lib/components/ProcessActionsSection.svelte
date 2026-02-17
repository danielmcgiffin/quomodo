<script lang="ts">
  import {
    dndzone,
    TRIGGERS,
    type DndEvent,
  } from "svelte-dnd-action"
  import { flip } from "svelte/animate"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import CopyLinkButton from "$lib/components/CopyLinkButton.svelte"

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
    title: string
    descriptionRich: string
    descriptionHtml: string
    ownerRole: Role | null
    system: System | null
  }

  let {
    actions,
    processSlug,
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
  }: {
    actions: ActionEntry[]
    processSlug: string
    totalActions?: number
    viewerRole: "owner" | "admin" | "editor" | "member"
    highlightedActionId?: string | null
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
    reorderActionError?: string
    onCreateAction: () => void
    onEditAction: (action: ActionEntry) => void
  } = $props()

  const actionFieldTargets = [
    { path: "description", label: "Description" },
    { path: "owner_role_id", label: "Owner role" },
    { path: "system_id", label: "System" },
    { path: "sequence", label: "Sequence" },
  ]

  const visibleActionCount = $derived(actions.length)
  const previewText = (html: string) =>
    html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const isInteractiveTarget = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, label, [role='button']",
      ),
    )
  const isTextEditTarget = (target: EventTarget | null): boolean =>
    target instanceof Element && Boolean(target.closest(".sc-action-text-hit"))

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
      const newIds = newItems.map((action) => action.id).join(",")
      const oldIds = actions.map((action) => action.id).join(",")
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
  const canReorder = $derived(viewerRole !== "member")
  let expandedActionIds = $state<Set<string>>(new Set())
  const areAllExpanded = $derived(
    items.length > 0 && expandedActionIds.size === items.length,
  )

  const toggleExpandAll = () => {
    if (areAllExpanded) {
      expandedActionIds = new Set()
      return
    }
    expandedActionIds = new Set(items.map((action) => action.id))
  }

  const handleCardIntent = (target: EventTarget | null, action: ActionEntry) => {
    if (isInteractiveTarget(target)) {
      return
    }
    const isExpanded = expandedActionIds.has(action.id)
    if (!isExpanded) {
      expandedActionIds = new Set([...expandedActionIds, action.id])
      return
    }
    if (isTextEditTarget(target)) {
      onEditAction(action)
      return
    }
    const next = new Set(expandedActionIds)
    next.delete(action.id)
    expandedActionIds = next
  }

  const onCardClick = (event: MouseEvent, action: ActionEntry) => {
    handleCardIntent(event.target, action)
  }

  const onCardKeydown = (event: KeyboardEvent, action: ActionEntry) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }
    event.preventDefault()
    handleCardIntent(event.target, action)
  }
</script>

<div class="sc-section">
  <div class="flex justify-between items-center gap-4 flex-wrap">
    <div class="sc-section-title">What Happens?</div>
    <div class="sc-actions">
      <button class="sc-btn secondary mb-2" type="button" onclick={toggleExpandAll}>
        {areAllExpanded ? "Collapse all" : "Expand all"}
      </button>
      <button class="sc-btn mb-2" type="button" onclick={onCreateAction}>
        Write an Action
      </button>
    </div>
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
      <div class="sc-page-subtitle">No actions connected yet.</div>
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
          id={`step-${action.sequence}`}
          style="scroll-margin-top: 96px;"
          role="button"
          tabindex="0"
          aria-label={`Expand action ${action.sequence}`}
          onclick={(event) => onCardClick(event, action)}
          onkeydown={(event) => onCardKeydown(event, action)}
        >
          <div class="sc-action-card-main">
            <div class="sc-action-title-row">
              <div class="font-bold text-lg">
                {action.title || `Action ${action.sequence}`}
              </div>
              <CopyLinkButton
                variant="icon"
                href={`/app/processes/${processSlug}#step-${action.sequence}`}
                label={`Copy link to action ${action.sequence}`}
              />
              <InlineEntityFlagControl
                inline={true}
                action="?/createFlag"
                targetType="action"
                targetId={action.id}
                entityLabel={action.title || `Action ${action.sequence}`}
                {viewerRole}
                fieldTargets={actionFieldTargets}
                errorMessage={createFlagError}
                errorTargetType={createFlagTargetType}
                errorTargetId={createFlagTargetId}
                errorTargetPath={createFlagTargetPath}
              />
            </div>
            <div class="sc-action-text-hit">
              {#if expandedActionIds.has(action.id)}
                <div class="sc-action-description">
                  <RichText html={action.descriptionHtml} />
                </div>
              {:else}
                <div class="sc-page-subtitle sc-action-preview">
                  {previewText(action.descriptionHtml) || "No description."}
                </div>
              {/if}
            </div>
          </div>
          <div class="sc-action-card-side">
            <div class="flex items-center justify-between gap-2">
              <div class="sc-action-sequence">{index + 1}</div>
            </div>
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

<style>
  .sc-action-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
  }

  .sc-action-preview {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .sc-action-text-hit {
    margin-top: 2px;
    border-radius: 8px;
    padding: 4px 6px;
  }

  .sc-action-card.is-highlighted .sc-action-text-hit,
  .sc-action-card:hover .sc-action-text-hit {
    background: color-mix(in srgb, var(--sc-white) 70%, transparent);
  }

  .sc-action-card .sc-action-text-hit:hover {
    outline: 1px solid var(--sc-border-strong);
    cursor: text;
  }
</style>
