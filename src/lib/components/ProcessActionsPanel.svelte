<script lang="ts">
  import ActionEditorModal from "$lib/components/ActionEditorModal.svelte"
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
    descriptionRich: string
    descriptionHtml: string
    ownerRole: SidebarRole | null
    system: SidebarSystem | null
  }

  type ProcessForm = {
    createActionError?: string
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
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
  }

  type Props = {
    actions: ActionEntry[]
    allRoles: SidebarRole[]
    allSystems: SidebarSystem[]
    viewerRole: "owner" | "admin" | "editor" | "member"
    highlightedActionId: string | null
    form?: ProcessForm
  }

  let {
    actions,
    allRoles,
    allSystems,
    viewerRole,
    highlightedActionId,
    form,
  }: Props = $props()

  const htmlToDraftText = (html: string): string =>
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  const uniqueById = <T extends { id: string }>(
    items: (T | null | undefined)[],
  ): T[] => {
    const seen = new Set<string>()
    const result: T[] = []
    for (const item of items) {
      if (!item || seen.has(item.id)) {
        continue
      }
      seen.add(item.id)
      result.push(item)
    }
    return result
  }

  const actionRoles = $derived.by(() =>
    uniqueById(actions.map((action: ActionEntry) => action.ownerRole ?? null)),
  )
  const actionSystems = $derived.by(() =>
    uniqueById(actions.map((action: ActionEntry) => action.system ?? null)),
  )

  let selectedActionRoleId = $state("")
  let selectedActionSystemId = $state("")
  const filteredActions = $derived.by(() =>
    actions.filter((action: ActionEntry) => {
      if (
        selectedActionRoleId &&
        action.ownerRole?.id !== selectedActionRoleId
      ) {
        return false
      }
      if (
        selectedActionSystemId &&
        action.system?.id !== selectedActionSystemId
      ) {
        return false
      }
      return true
    }),
  )

  let isCreateActionModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)
  let isCreateSystemModalOpen = $state(false)
  let actionDescriptionDraft = $state("")
  let actionDescriptionRichDraft = $state("")
  let selectedOwnerRoleId = $state("")
  let selectedSystemId = $state("")
  let editingActionId = $state<string | null>(null)
  let actionToastMessage = $state("")
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  const isInteractiveTarget = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, textarea, select, label, [role='button']",
      ),
    )

  const openCreateActionModal = () => {
    editingActionId = null
    actionDescriptionDraft = ""
    actionDescriptionRichDraft = ""
    selectedOwnerRoleId = form?.createdRoleId ?? ""
    selectedSystemId = form?.createdSystemId ?? ""
    isCreateActionModalOpen = true
  }

  const openEditActionModal = (event: MouseEvent, action: ActionEntry) => {
    if (isInteractiveTarget(event.target)) {
      return
    }
    editingActionId = action.id
    actionDescriptionDraft = htmlToDraftText(action.descriptionHtml)
    actionDescriptionRichDraft = action.descriptionRich
    selectedOwnerRoleId = action.ownerRole?.id ?? ""
    selectedSystemId = action.system?.id ?? ""
    isCreateActionModalOpen = true
  }

  const onActionCardKeydown = (event: KeyboardEvent, action: ActionEntry) => {
    if (isInteractiveTarget(event.target)) {
      return
    }
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }
    event.preventDefault()
    editingActionId = action.id
    actionDescriptionDraft = htmlToDraftText(action.descriptionHtml)
    actionDescriptionRichDraft = action.descriptionRich
    selectedOwnerRoleId = action.ownerRole?.id ?? ""
    selectedSystemId = action.system?.id ?? ""
    isCreateActionModalOpen = true
  }

  $effect(() => {
    if (typeof form?.actionDescriptionDraft === "string") {
      actionDescriptionDraft = form.actionDescriptionDraft
    }
    if (typeof form?.actionDescriptionRichDraft === "string") {
      actionDescriptionRichDraft = form.actionDescriptionRichDraft
    }
    if (typeof form?.selectedOwnerRoleId === "string") {
      selectedOwnerRoleId = form.selectedOwnerRoleId
    }
    if (typeof form?.selectedSystemId === "string") {
      selectedSystemId = form.selectedSystemId
    }
    if (typeof form?.editingActionId === "string") {
      editingActionId = form.editingActionId || null
    }
    if (
      form?.createActionError ||
      form?.deleteActionError ||
      form?.createRoleError ||
      form?.createRoleSuccess ||
      form?.createSystemError ||
      form?.createSystemSuccess
    ) {
      isCreateActionModalOpen = true
    }
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
    if (form?.createSystemError) {
      isCreateSystemModalOpen = true
    }
    if (form?.createRoleSuccess && form?.createdRoleId) {
      selectedOwnerRoleId = form.createdRoleId
    }
    if (form?.createSystemSuccess && form?.createdSystemId) {
      selectedSystemId = form.createdSystemId
    }
    if (form?.createRoleSuccess) {
      actionToastMessage = "Role created. It is preselected above."
    } else if (form?.createSystemSuccess) {
      actionToastMessage = "System created. It is preselected above."
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
  actions={filteredActions}
  {actionRoles}
  {actionSystems}
  bind:selectedRoleId={selectedActionRoleId}
  bind:selectedSystemId={selectedActionSystemId}
  totalActions={actions.length}
  {viewerRole}
  {highlightedActionId}
  reorderActionError={form?.reorderActionError}
  createFlagError={form?.createFlagError}
  createFlagTargetType={form?.createFlagTargetType}
  createFlagTargetId={form?.createFlagTargetId}
  createFlagTargetPath={form?.createFlagTargetPath}
  onCreateAction={openCreateActionModal}
  onEditAction={openEditActionModal}
  onActionKeydown={onActionCardKeydown}
/>

<ActionEditorModal
  bind:open={isCreateActionModalOpen}
  bind:editingActionId
  bind:actionDescriptionDraft
  bind:actionDescriptionRichDraft
  bind:selectedOwnerRoleId
  bind:selectedSystemId
  {allRoles}
  {allSystems}
  createdRoleId={form?.createdRoleId}
  createdSystemId={form?.createdSystemId}
  createActionError={form?.createActionError}
  deleteActionError={form?.deleteActionError}
  onOpenRoleModal={() => {
    isCreateRoleModalOpen = true
  }}
  onOpenSystemModal={() => {
    isCreateSystemModalOpen = true
  }}
/>

<InlineCreateRoleModal
  bind:open={isCreateRoleModalOpen}
  action="?/createRole"
  errorMessage={form?.createRoleError}
  description="Create a role without leaving action authoring."
  helperText="This role is immediately available for action ownership."
  {actionDescriptionDraft}
  {actionDescriptionRichDraft}
/>

<InlineCreateSystemModal
  bind:open={isCreateSystemModalOpen}
  action="?/createSystem"
  roles={allRoles}
  selectedRoleId={form?.createdRoleId}
  errorMessage={form?.createSystemError}
  description="Create a system without leaving action authoring."
  helperText="This system is immediately available for action linking."
  {actionDescriptionDraft}
  {actionDescriptionRichDraft}
/>

{#if actionToastMessage}
  <div class="sc-toast sc-toast-modal-below" role="status" aria-live="polite">
    {actionToastMessage}
  </div>
{/if}
