<script lang="ts">
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"

  type Role = { id: string; name: string }
  type System = { id: string; name: string }

  type ActionDraftSnapshot = {
    actionTitleDraft: string
    actionDescriptionDraft: string
    actionDescriptionRichDraft: string
    selectedOwnerRoleId: string
    selectedSystemId: string
    editingActionId: string
    actionSequenceDraft: string
  }

  type ActionEntry = {
    id: string
    sequence: number
    title: string
    descriptionRich: string
    descriptionHtml: string
    ownerRole: { id: string } | null
    system: { id: string } | null
  }

  let {
    action,
    insertAtSequence,
    sequenceDisplay,
    allRoles,
    allSystems,
    createdRoleId,
    createdSystemId,
    createActionError,
    deleteActionError,
    onCancel,
    onRequestCreateRole,
    onRequestCreateSystem,
    restoredDraft,
  }: {
    action?: ActionEntry | null
    insertAtSequence?: number | null
    sequenceDisplay: number
    allRoles: Role[]
    allSystems: System[]
    createdRoleId?: string
    createdSystemId?: string
    createActionError?: string
    deleteActionError?: string
    onCancel: () => void
    onRequestCreateRole: (draft: ActionDraftSnapshot) => void
    onRequestCreateSystem: (draft: ActionDraftSnapshot) => void
    restoredDraft?: ActionDraftSnapshot | null
  } = $props()

  const isEditMode = $derived(action != null && action.id != null)

  let titleDraft = $state("")
  let descriptionDraft = $state("")
  let descriptionRichDraft = $state("")
  let selectedOwnerRoleId = $state("")
  let selectedSystemId = $state("")
  let initialized = false

  $effect(() => {
    if (initialized) return
    if (restoredDraft) {
      titleDraft = restoredDraft.actionTitleDraft ?? ""
      descriptionDraft = restoredDraft.actionDescriptionDraft
      descriptionRichDraft = restoredDraft.actionDescriptionRichDraft
      selectedOwnerRoleId = restoredDraft.selectedOwnerRoleId
      selectedSystemId = restoredDraft.selectedSystemId
    } else if (action) {
      titleDraft = action.title ?? ""
      descriptionRichDraft = action.descriptionRich
      selectedOwnerRoleId = action.ownerRole?.id ?? ""
      selectedSystemId = action.system?.id ?? ""
    }
    initialized = true
  })

  $effect(() => {
    if (createdRoleId) {
      selectedOwnerRoleId = createdRoleId
    }
  })

  $effect(() => {
    if (createdSystemId) {
      selectedSystemId = createdSystemId
    }
  })

  const selectedRoleName = $derived(
    allRoles.find((r) => r.id === selectedOwnerRoleId)?.name ?? "",
  )
  const selectedSystemName = $derived(
    allSystems.find((s) => s.id === selectedSystemId)?.name ?? "",
  )

  const buildDraft = (): ActionDraftSnapshot => ({
    actionTitleDraft: titleDraft,
    actionDescriptionDraft: descriptionDraft,
    actionDescriptionRichDraft: descriptionRichDraft,
    selectedOwnerRoleId,
    selectedSystemId,
    editingActionId: action?.id ?? "",
    actionSequenceDraft: insertAtSequence != null ? String(insertAtSequence) : "",
  })

  const handleRoleChange = (event: Event) => {
    const select = event.target as HTMLSelectElement
    if (select.value === "__new__") {
      select.value = selectedOwnerRoleId
      onRequestCreateRole(buildDraft())
    }
  }

  const handleSystemChange = (event: Event) => {
    const select = event.target as HTMLSelectElement
    if (select.value === "__new__") {
      select.value = selectedSystemId
      onRequestCreateSystem(buildDraft())
    }
  }

  const confirmDeleteAction = (event: SubmitEvent) => {
    const shouldDelete = confirm("Delete this action from this process?")
    if (!shouldDelete) {
      event.preventDefault()
    }
  }
</script>

<div class="sc-inline-edit-form">
  <form
    id="sc-save-action-form"
    class="sc-inline-edit-form-body"
    method="POST"
    action="?/createAction"
    use:pendingEnhance
  >
    {#if isEditMode}
      <input type="hidden" name="action_id" value={action?.id} />
    {/if}
    {#if insertAtSequence != null}
      <input type="hidden" name="sequence" value={insertAtSequence} />
    {/if}

    {#if createActionError}
      <div class="sc-form-error" style="margin-bottom: 8px;">{createActionError}</div>
    {/if}
    {#if deleteActionError}
      <div class="sc-form-error" style="margin-bottom: 8px;">{deleteActionError}</div>
    {/if}

    <div class="sc-action-card-main">
      <div class="sc-action-title-row">
        <input
          class="sc-inline-edit-title font-bold text-lg"
          type="text"
          name="title"
          placeholder="Action title..."
          bind:value={titleDraft}
        />
      </div>
      <div class="sc-inline-edit-description">
        <RichTextEditor
          fieldName="description_rich"
          textFieldName="description"
          bind:richValue={descriptionRichDraft}
          bind:textValue={descriptionDraft}
          required
        />
      </div>
    </div>

    <div class="sc-action-card-side">
      <div class="flex items-center justify-between gap-2">
        <div class="sc-action-sequence">{sequenceDisplay}</div>
      </div>
      <div class="sc-action-side-row">
        <select
          class="sc-inline-edit-select"
          name="owner_role_id"
          bind:value={selectedOwnerRoleId}
          onchange={handleRoleChange}
          required
        >
          <option value="">Select role...</option>
          <option value="__new__">+ New Role...</option>
          {#each allRoles as role}
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
      </div>
      <div class="sc-action-side-row">
        <select
          class="sc-inline-edit-select"
          name="system_id"
          bind:value={selectedSystemId}
          onchange={handleSystemChange}
          required
        >
          <option value="">Select system...</option>
          <option value="__new__">+ New System...</option>
          {#each allSystems as system}
            <option value={system.id}>{system.name}</option>
          {/each}
        </select>
      </div>
    </div>
  </form>

  <div class="sc-inline-edit-bar">
    {#if isEditMode}
      <form
        method="POST"
        action="?/deleteAction"
        onsubmit={confirmDeleteAction}
        use:pendingEnhance
        class="sc-inline-edit-bar-delete"
      >
        <input type="hidden" name="action_id" value={action?.id} />
        <button class="sc-inline-edit-link danger" type="submit" data-loading-label="Deleting...">
          Delete
        </button>
      </form>
    {/if}
    <div class="sc-inline-edit-bar-spacer"></div>
    <button class="sc-inline-edit-link" type="button" onclick={onCancel}>
      Cancel
    </button>
    <button class="sc-btn sc-btn-sm" type="submit" form="sc-save-action-form" data-loading-label="Saving...">
      {isEditMode ? "Save" : "Create"}
    </button>
  </div>
</div>

<style>
  /* Wrapper takes over the card grid layout */
  .sc-inline-edit-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 180px;
    gap: 20px;
    align-items: start;
  }

  /* Form uses display:contents so its children participate in the parent grid */
  .sc-inline-edit-form-body {
    display: contents;
  }

  /* Title input: looks like the title text */
  .sc-inline-edit-title {
    width: 100%;
    background: transparent;
    border: 1.5px solid transparent;
    border-radius: 6px;
    padding: 2px 4px;
    margin: 0;
    font-family: inherit;
    color: inherit;
    outline: none;
    transition: border-color 150ms ease;
  }

  .sc-inline-edit-title:focus {
    border-color: #b42318;
  }

  .sc-inline-edit-title::placeholder {
    color: var(--sc-text-muted, #999);
    font-weight: normal;
  }

  /* Description editor: blends in with card content */
  .sc-inline-edit-description {
    margin-top: 2px;
    border-radius: 8px;
    padding: 0;
  }

  .sc-inline-edit-description :global(.sc-rich-editor) {
    border: 1.5px solid transparent;
    border-radius: 8px;
    transition: border-color 150ms ease;
  }

  .sc-inline-edit-description :global(.sc-rich-editor:focus-within) {
    border-color: #b42318;
  }

  .sc-inline-edit-description :global(.sc-rich-editor-toolbar) {
    opacity: 0;
    transition: opacity 150ms ease;
    border-bottom: 1px solid var(--sc-border, #e5e5e5);
    padding: 2px 4px;
  }

  .sc-inline-edit-description :global(.sc-rich-editor:focus-within .sc-rich-editor-toolbar) {
    opacity: 1;
  }

  .sc-inline-edit-description :global(.sc-rich-editor-shell) {
    padding: 0;
  }

  .sc-inline-edit-description :global(.sc-rich-editor-content) {
    padding: 4px 6px;
    min-height: 3em;
  }

  .sc-inline-edit-description :global(.sc-rich-editor-required) {
    position: absolute;
    opacity: 0;
    height: 0;
    pointer-events: none;
  }

  /* Sidebar selects: compact, matches portal style */
  .sc-inline-edit-select {
    width: 100%;
    font-size: 0.8125rem;
    padding: 4px 8px;
    border: 1.5px solid var(--sc-border, #e5e5e5);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font-family: inherit;
    cursor: pointer;
    outline: none;
    transition: border-color 150ms ease;
    appearance: auto;
  }

  .sc-inline-edit-select:focus {
    border-color: #b42318;
  }

  /* Bottom action bar */
  .sc-inline-edit-bar {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--sc-border, #e5e5e5);
    margin-top: 4px;
  }

  .sc-inline-edit-bar-delete {
    display: contents;
  }

  .sc-inline-edit-bar-spacer {
    flex: 1;
  }

  .sc-inline-edit-link {
    background: none;
    border: none;
    padding: 4px 8px;
    font-size: 0.8125rem;
    font-family: inherit;
    color: var(--sc-text-muted, #666);
    cursor: pointer;
    border-radius: 4px;
    transition: color 150ms ease;
  }

  .sc-inline-edit-link:hover {
    color: var(--sc-text, #111);
  }

  .sc-inline-edit-link.danger {
    color: #b42318;
  }

  .sc-inline-edit-link.danger:hover {
    color: #912018;
  }

  .sc-btn-sm {
    padding: 4px 14px;
    font-size: 0.8125rem;
  }

  @media (max-width: 768px) {
    .sc-inline-edit-form {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
  }
</style>
