<script lang="ts">
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"

  type Role = { id: string; name: string }
  type System = { id: string; name: string }

  type ActionDraftSnapshot = {
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
    descriptionRich: string
    descriptionHtml: string
    ownerRole: { id: string } | null
    system: { id: string } | null
  }

  let {
    action,
    insertAtSequence,
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

  let descriptionDraft = $state("")
  let descriptionRichDraft = $state("")
  let selectedOwnerRoleId = $state("")
  let selectedSystemId = $state("")
  let initialized = false

  $effect(() => {
    if (initialized) return
    if (restoredDraft) {
      descriptionDraft = restoredDraft.actionDescriptionDraft
      descriptionRichDraft = restoredDraft.actionDescriptionRichDraft
      selectedOwnerRoleId = restoredDraft.selectedOwnerRoleId
      selectedSystemId = restoredDraft.selectedSystemId
    } else if (action) {
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

  const buildDraft = (): ActionDraftSnapshot => ({
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

<div class="sc-action-inline-editor">
  <form
    class="sc-form"
    method="POST"
    action="?/createAction"
    use:pendingEnhance
  >
    {#if createActionError}
      <div class="sc-form-error">{createActionError}</div>
    {/if}
    {#if deleteActionError}
      <div class="sc-form-error">{deleteActionError}</div>
    {/if}
    {#if isEditMode}
      <input type="hidden" name="action_id" value={action?.id} />
    {/if}
    {#if insertAtSequence != null}
      <input type="hidden" name="sequence" value={insertAtSequence} />
    {/if}

    <div class="sc-form-row">
      <RichTextEditor
        fieldName="description_rich"
        textFieldName="description"
        bind:richValue={descriptionRichDraft}
        bind:textValue={descriptionDraft}
        required
      />
    </div>

    <div class="sc-form-row sc-inline-editor-controls">
      <select
        class="sc-search sc-field"
        name="owner_role_id"
        bind:value={selectedOwnerRoleId}
        onchange={handleRoleChange}
        required
      >
        <option value="">Role responsible</option>
        <option value="__new__">+ New Role...</option>
        {#each allRoles as role}
          <option value={role.id}>{role.name}</option>
        {/each}
      </select>

      <select
        class="sc-search sc-field"
        name="system_id"
        bind:value={selectedSystemId}
        onchange={handleSystemChange}
        required
      >
        <option value="">System</option>
        <option value="__new__">+ New System...</option>
        {#each allSystems as system}
          <option value={system.id}>{system.name}</option>
        {/each}
      </select>
    </div>

    <div class="sc-form-row sc-inline-editor-actions">
      <button class="sc-btn" type="submit" data-loading-label="Saving...">
        {isEditMode ? "Save" : "Create Action"}
      </button>
      <button class="sc-btn secondary" type="button" onclick={onCancel}>
        Cancel
      </button>
      {#if isEditMode}
        <div class="sc-inline-editor-spacer"></div>
      {/if}
    </div>
  </form>

  {#if isEditMode}
    <form
      method="POST"
      action="?/deleteAction"
      onsubmit={confirmDeleteAction}
      use:pendingEnhance
      class="sc-inline-editor-delete-form"
    >
      <input type="hidden" name="action_id" value={action?.id} />
      <button
        class="sc-btn danger"
        type="submit"
        data-loading-label="Deleting..."
      >
        Delete
      </button>
    </form>
  {/if}
</div>

<style>
  .sc-action-inline-editor {
    padding: 12px 16px;
  }

  .sc-inline-editor-controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sc-inline-editor-controls select {
    flex: 1;
    min-width: 160px;
  }

  .sc-inline-editor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sc-inline-editor-spacer {
    flex: 1;
  }

  .sc-inline-editor-delete-form {
    display: inline;
    float: right;
    margin-top: -38px;
    margin-right: 0;
  }
</style>
