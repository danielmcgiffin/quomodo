<script lang="ts">
  import RichText from "$lib/components/RichText.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineCreateSystemModal from "$lib/components/InlineCreateSystemModal.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"
  import ProcessOverviewCard from "$lib/components/ProcessOverviewCard.svelte"
  import ProcessActionsSection from "$lib/components/ProcessActionsSection.svelte"
  import ProcessTraverseCard from "$lib/components/ProcessTraverseCard.svelte"
  import ActionEditorModal from "$lib/components/ActionEditorModal.svelte"
  import ScModal from "$lib/components/ScModal.svelte"

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
    descriptionHtml: string
    ownerRole: SidebarRole | null
    system: SidebarSystem | null
  }
  type ProcessForm = {
    updateProcessError?: string
    deleteProcessError?: string
    createActionError?: string
    deleteActionError?: string
    reorderActionError?: string
    createRoleError?: string
    createRoleSuccess?: boolean
    createSystemError?: string
    createSystemSuccess?: boolean
    createdRoleId?: string
    createdSystemId?: string
    processNameDraft?: string
    processDescriptionDraft?: string
    processTriggerDraft?: string
    processEndStateDraft?: string
    selectedProcessOwnerRoleIdDraft?: string
    actionDescriptionDraft?: string
    selectedOwnerRoleId?: string
    selectedSystemId?: string
    editingActionId?: string
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
  }
  type ProcessData = {
    process: {
      id: string
      slug: string
      name: string
      descriptionHtml: string
      trigger: string
      endState: string
      ownerRole?: SidebarRole | null
    }
    actions: ActionEntry[]
    allRoles: SidebarRole[]
    allSystems: SidebarSystem[]
    processFlags: {
      id: string
      flagType: string
      createdAt: string
      message: string
    }[]
    viewerRole: "owner" | "admin" | "editor" | "member"
    highlightedActionId: string | null
    highlightedFlagId: string | null
  }

  let { data, form }: { data: ProcessData; form?: ProcessForm } = $props()

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

  const actions = $derived.by(() => (data.actions ?? []) as ActionEntry[])

  const actionRoles = $derived.by(() =>
    uniqueById(actions.map((action: ActionEntry) => action.ownerRole ?? null)),
  )
  const actionSystems = $derived.by(() =>
    uniqueById(actions.map((action: ActionEntry) => action.system ?? null)),
  )

  let isCreateActionModalOpen = $state(false)
  let isEditProcessModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)
  let isCreateSystemModalOpen = $state(false)
  let processNameDraft = $state("")
  let processDescriptionDraft = $state("")
  let processTriggerDraft = $state("")
  let processEndStateDraft = $state("")
  let selectedProcessOwnerRoleId = $state("")
  let actionDescriptionDraft = $state("")
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
    selectedOwnerRoleId = form?.createdRoleId ?? ""
    selectedSystemId = form?.createdSystemId ?? ""
    isCreateActionModalOpen = true
  }

  const canEditProcess = () => data.viewerRole !== "member"

  const setProcessDraftsFromData = () => {
    processNameDraft = data.process.name
    processDescriptionDraft = htmlToDraftText(data.process.descriptionHtml)
    processTriggerDraft = data.process.trigger ?? ""
    processEndStateDraft = data.process.endState ?? ""
    selectedProcessOwnerRoleId = data.process.ownerRole?.id ?? ""
  }

  const openEditProcessModal = () => {
    setProcessDraftsFromData()
    isEditProcessModalOpen = true
  }

  const confirmDeleteProcess = (event: SubmitEvent) => {
    const shouldDelete = confirm(
      "Delete this process and all of its actions?",
    )
    if (!shouldDelete) {
      event.preventDefault()
    }
  }

  const openEditActionModal = (event: MouseEvent, action: ActionEntry) => {
    if (isInteractiveTarget(event.target)) {
      return
    }
    editingActionId = action.id
    actionDescriptionDraft = htmlToDraftText(action.descriptionHtml)
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
    selectedOwnerRoleId = action.ownerRole?.id ?? ""
    selectedSystemId = action.system?.id ?? ""
    isCreateActionModalOpen = true
  }

  $effect(() => {
    if (form?.updateProcessError) {
      isEditProcessModalOpen = true
    }
    processNameDraft =
      typeof form?.processNameDraft === "string"
        ? form.processNameDraft
        : data.process.name
    processDescriptionDraft =
      typeof form?.processDescriptionDraft === "string"
        ? form.processDescriptionDraft
        : htmlToDraftText(data.process.descriptionHtml)
    processTriggerDraft =
      typeof form?.processTriggerDraft === "string"
        ? form.processTriggerDraft
        : data.process.trigger
    processEndStateDraft =
      typeof form?.processEndStateDraft === "string"
        ? form.processEndStateDraft
        : data.process.endState
    selectedProcessOwnerRoleId =
      typeof form?.selectedProcessOwnerRoleIdDraft === "string"
        ? form.selectedProcessOwnerRoleIdDraft
        : (data.process.ownerRole?.id ?? "")

    if (typeof form?.actionDescriptionDraft === "string") {
      actionDescriptionDraft = form.actionDescriptionDraft
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

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main">
      <div class="flex justify-between items-start gap-4 flex-wrap">
        <div class="flex flex-col">
          <div class="sc-page-title">{data.process.name}</div>
          <div class="sc-page-subtitle">
            <RichText html={data.process.descriptionHtml} />
          </div>
        </div>
        {#if canEditProcess()}
          <div class="sc-actions">
            <button
              class="sc-btn secondary"
              type="button"
              onclick={openEditProcessModal}
            >
              Edit Process
            </button>
            <form method="POST" action="?/deleteProcess" onsubmit={confirmDeleteProcess}>
              <input type="hidden" name="process_id" value={data.process.id} />
              <button class="sc-btn secondary" type="submit">Delete Process</button>
            </form>
          </div>
        {/if}
      </div>

      {#if form?.deleteProcessError}
        <div class="sc-form-error sc-stack-top-10">{form.deleteProcessError}</div>
      {/if}

      <ScModal
        bind:open={isEditProcessModalOpen}
        title="Edit Process"
        description="Update process intent, trigger, outcome, and owner."
        maxWidth="760px"
      >
        <form class="sc-form" method="POST" action="?/updateProcess">
          <input type="hidden" name="process_id" value={data.process.id} />
          {#if form?.updateProcessError}
            <div class="sc-form-error">{form.updateProcessError}</div>
          {/if}
          <div class="sc-form-row">
            <input
              class="sc-search sc-field"
              name="name"
              placeholder="Process name"
              bind:value={processNameDraft}
              required
            />
          </div>
          <div class="sc-form-row">
            <textarea
              class="sc-search sc-field sc-textarea"
              name="description"
              placeholder="Process description - an explanation about why you do the process"
              bind:value={processDescriptionDraft}
              rows="4"
            ></textarea>
          </div>
          <div class="sc-form-row">
            <textarea
              class="sc-search sc-field sc-textarea"
              name="trigger"
              placeholder="Trigger - What event or schedule kicks off the process?"
              bind:value={processTriggerDraft}
              rows="3"
            ></textarea>
            <textarea
              class="sc-search sc-field sc-textarea"
              name="end_state"
              placeholder="Outcome - What should be different at the end of the process?"
              bind:value={processEndStateDraft}
              rows="3"
            ></textarea>
          </div>
          <div class="sc-form-actions">
            <select
              class="sc-search sc-field"
              name="owner_role_id"
              bind:value={selectedProcessOwnerRoleId}
            >
              <option value="">Owner role (optional)</option>
              {#each data.allRoles as role}
                <option value={role.id}>{role.name}</option>
              {/each}
            </select>
            <button class="sc-btn" type="submit">Save Process</button>
          </div>
        </form>
      </ScModal>

      <ProcessOverviewCard
        process={data.process}
        {actionRoles}
        {actionSystems}
        viewerRole={data.viewerRole}
        createFlagError={form?.createFlagError}
        createFlagTargetType={form?.createFlagTargetType}
        createFlagTargetId={form?.createFlagTargetId}
        createFlagTargetPath={form?.createFlagTargetPath}
      />

      <ProcessActionsSection
        {actions}
        viewerRole={data.viewerRole}
        highlightedActionId={data.highlightedActionId}
        reorderActionError={form?.reorderActionError}
        createFlagError={form?.createFlagError}
        createFlagTargetType={form?.createFlagTargetType}
        createFlagTargetId={form?.createFlagTargetId}
        createFlagTargetPath={form?.createFlagTargetPath}
        onCreateAction={openCreateActionModal}
        onEditAction={openEditActionModal}
        onActionKeydown={onActionCardKeydown}
      />
    </div>
    <aside class="sc-process-sidebar">
      <FlagSidebar
        title="Flags"
        flags={data.processFlags.map((flag) => ({
          id: flag.id,
          href: `/app/processes/${data.process.slug}?flagId=${flag.id}`,
          flagType: flag.flagType ?? "flag",
          createdAt: flag.createdAt,
          message: flag.message,
          context: data.process.name,
        }))}
        highlightedFlagId={data.highlightedFlagId}
      />
    </aside>
  </div>

  <ProcessTraverseCard process={data.process} {actionRoles} {actionSystems} />

  <ActionEditorModal
    bind:open={isCreateActionModalOpen}
    bind:editingActionId
    bind:actionDescriptionDraft
    bind:selectedOwnerRoleId
    bind:selectedSystemId
    allRoles={data.allRoles}
    allSystems={data.allSystems}
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
  />

  <InlineCreateSystemModal
    bind:open={isCreateSystemModalOpen}
    action="?/createSystem"
    roles={data.allRoles}
    selectedRoleId={form?.createdRoleId}
    errorMessage={form?.createSystemError}
    description="Create a system without leaving action authoring."
    helperText="This system is immediately available for action linking."
    {actionDescriptionDraft}
  />

  {#if actionToastMessage}
    <div class="sc-toast sc-toast-modal-below" role="status" aria-live="polite">
      {actionToastMessage}
    </div>
  {/if}
</div>
