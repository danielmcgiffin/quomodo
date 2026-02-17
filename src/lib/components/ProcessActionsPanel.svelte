<script lang="ts">
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineCreateSystemModal from "$lib/components/InlineCreateSystemModal.svelte"
  import ProcessActionsSection from "$lib/components/ProcessActionsSection.svelte"

  type SidebarRole = {
    id: string
    slug: string
    name: string
    initials: string
  }
  type SidebarSystem = {
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
    ownerRole: SidebarRole | null
    system: SidebarSystem | null
  }

  type ActionDraftSnapshot = {
    actionDescriptionDraft: string
    actionDescriptionRichDraft: string
    selectedOwnerRoleId: string
    selectedSystemId: string
    editingActionId: string
    actionSequenceDraft: string
  }

  type ProcessForm = {
    createActionSuccess?: boolean
    createActionError?: string
    deleteActionSuccess?: boolean
    deleteActionError?: string
    reorderActionError?: string
    createRoleError?: string
    createRoleSuccess?: boolean
    createSystemError?: string
    createSystemSuccess?: boolean
    createdRoleId?: string
    createdSystemId?: string
    actionDescriptionDraft?: string
    actionDescriptionRichDraft?: string
    selectedOwnerRoleId?: string
    selectedSystemId?: string
    editingActionId?: string
    actionSequenceDraft?: string
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
  }

  type Props = {
    actions: ActionEntry[]
    processSlug: string
    allRoles: SidebarRole[]
    allSystems: SidebarSystem[]
    viewerRole: "owner" | "admin" | "editor" | "member"
    highlightedActionId: string | null
    form?: ProcessForm
  }

  let {
    actions,
    processSlug,
    allRoles,
    allSystems,
    viewerRole,
    highlightedActionId,
    form,
  }: Props = $props()

  const emptyDraftSnapshot = (): ActionDraftSnapshot => ({
    actionDescriptionDraft: "",
    actionDescriptionRichDraft: "",
    selectedOwnerRoleId: "",
    selectedSystemId: "",
    editingActionId: "",
    actionSequenceDraft: "",
  })

  let isCreateRoleModalOpen = $state(false)
  let isCreateSystemModalOpen = $state(false)
  let modalDraft = $state<ActionDraftSnapshot>(emptyDraftSnapshot())
  let actionToastMessage = $state("")
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  // Inline editing state
  let editingActionId = $state<string | null>(null)
  let insertingAtSequence = $state<number | null>(null)
  let restoredDraft = $state<ActionDraftSnapshot | null>(null)
  let formProcessed = $state(false)

  const openEditor = (action: ActionEntry) => {
    editingActionId = action.id
    insertingAtSequence = null
    restoredDraft = null
    formProcessed = false
  }

  const openInsert = (sequence: number) => {
    editingActionId = null
    insertingAtSequence = sequence
    restoredDraft = null
    formProcessed = false
  }

  const closeEditor = () => {
    editingActionId = null
    insertingAtSequence = null
    restoredDraft = null
  }

  const openCreateRoleModal = (draft: ActionDraftSnapshot) => {
    modalDraft = { ...draft }
    isCreateRoleModalOpen = true
  }

  const openCreateSystemModal = (draft: ActionDraftSnapshot) => {
    modalDraft = { ...draft }
    isCreateSystemModalOpen = true
  }

  $effect(() => {
    // Handle createAction success
    if (form?.createActionSuccess && !formProcessed) {
      closeEditor()
      formProcessed = true
      return
    }

    // Handle deleteAction success
    if (form?.deleteActionSuccess && !formProcessed) {
      closeEditor()
      formProcessed = true
      return
    }

    // Restore draft state from modal roundtrips
    if (typeof form?.actionDescriptionDraft === "string") {
      modalDraft.actionDescriptionDraft = form.actionDescriptionDraft
    }
    if (typeof form?.actionDescriptionRichDraft === "string") {
      modalDraft.actionDescriptionRichDraft = form.actionDescriptionRichDraft
    }
    if (typeof form?.selectedOwnerRoleId === "string") {
      modalDraft.selectedOwnerRoleId = form.selectedOwnerRoleId
    }
    if (typeof form?.selectedSystemId === "string") {
      modalDraft.selectedSystemId = form.selectedSystemId
    }
    if (typeof form?.editingActionId === "string") {
      modalDraft.editingActionId = form.editingActionId
    }
    if (typeof form?.actionSequenceDraft === "string") {
      modalDraft.actionSequenceDraft = form.actionSequenceDraft
    }

    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
    if (form?.createSystemError) {
      isCreateSystemModalOpen = true
    }

    if (form?.createRoleSuccess || form?.createSystemSuccess) {
      // Restore inline editor state from echoed form fields
      const restored: ActionDraftSnapshot = {
        actionDescriptionDraft: form?.actionDescriptionDraft ?? "",
        actionDescriptionRichDraft: form?.actionDescriptionRichDraft ?? "",
        selectedOwnerRoleId: form?.selectedOwnerRoleId ?? "",
        selectedSystemId: form?.selectedSystemId ?? "",
        editingActionId: form?.editingActionId ?? "",
        actionSequenceDraft: form?.actionSequenceDraft ?? "",
      }

      // Re-open the inline editor in the correct mode
      if (restored.editingActionId) {
        editingActionId = restored.editingActionId
        insertingAtSequence = null
      } else if (restored.actionSequenceDraft) {
        insertingAtSequence = Number(restored.actionSequenceDraft) || null
        editingActionId = null
      }

      restoredDraft = restored

      if (form?.createRoleSuccess) {
        actionToastMessage = "Role created. It is preselected in the editor."
      } else {
        actionToastMessage = "System created. It is preselected in the editor."
      }
    } else {
      return
    }

    if (toastTimer) {
      clearTimeout(toastTimer)
    }
    toastTimer = setTimeout(() => {
      actionToastMessage = ""
      toastTimer = null
    }, 2800)
  })
</script>

<ProcessActionsSection
  {actions}
  {processSlug}
  totalActions={actions.length}
  {allRoles}
  {allSystems}
  {viewerRole}
  {highlightedActionId}
  reorderActionError={form?.reorderActionError}
  createFlagError={form?.createFlagError}
  createFlagTargetType={form?.createFlagTargetType}
  createFlagTargetId={form?.createFlagTargetId}
  createFlagTargetPath={form?.createFlagTargetPath}
  {editingActionId}
  {insertingAtSequence}
  {restoredDraft}
  createdRoleId={form?.createdRoleId}
  createdSystemId={form?.createdSystemId}
  createActionError={form?.createActionError}
  deleteActionError={form?.deleteActionError}
  onOpenEditor={openEditor}
  onOpenInsert={openInsert}
  onCloseEditor={closeEditor}
  onRequestCreateRole={openCreateRoleModal}
  onRequestCreateSystem={openCreateSystemModal}
/>

<InlineCreateRoleModal
  bind:open={isCreateRoleModalOpen}
  action="?/createRole"
  errorMessage={form?.createRoleError}
  description="Create a role without leaving action authoring."
  helperText="This role is immediately available for action ownership."
  actionDescriptionDraft={modalDraft.actionDescriptionDraft}
  actionDescriptionRichDraft={modalDraft.actionDescriptionRichDraft}
  selectedOwnerRoleId={modalDraft.selectedOwnerRoleId}
  selectedSystemId={modalDraft.selectedSystemId}
  editingActionId={modalDraft.editingActionId}
  actionSequenceDraft={modalDraft.actionSequenceDraft}
/>

<InlineCreateSystemModal
  bind:open={isCreateSystemModalOpen}
  action="?/createSystem"
  roles={allRoles}
  selectedRoleId={modalDraft.selectedOwnerRoleId}
  errorMessage={form?.createSystemError}
  description="Create a system without leaving action authoring."
  helperText="This system is immediately available for action linking."
  actionDescriptionDraft={modalDraft.actionDescriptionDraft}
  actionDescriptionRichDraft={modalDraft.actionDescriptionRichDraft}
  selectedOwnerRoleId={modalDraft.selectedOwnerRoleId}
  selectedSystemId={modalDraft.selectedSystemId}
  editingActionId={modalDraft.editingActionId}
  actionSequenceDraft={modalDraft.actionSequenceDraft}
/>

{#if actionToastMessage}
  <div class="sc-toast sc-toast-modal-below" role="status" aria-live="polite">
    {actionToastMessage}
  </div>
{/if}
