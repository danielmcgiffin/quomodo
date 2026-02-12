<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineCreateSystemModal from "$lib/components/InlineCreateSystemModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

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
    createActionError?: string
    createRoleError?: string
    createRoleSuccess?: boolean
    createSystemError?: string
    createSystemSuccess?: boolean
    createdRoleId?: string
    createdSystemId?: string
    actionDescriptionDraft?: string
    selectedOwnerRoleId?: string
    selectedSystemId?: string
    editingActionId?: string
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
  }
  type ProcessData = {
    process: {
      id: string
      slug: string
      name: string
      descriptionHtml: string
      trigger: string
      endState: string
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
  let isCreateRoleModalOpen = $state(false)
  let isCreateSystemModalOpen = $state(false)
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
      <div class="sc-page-title">{data.process.name}</div>
      <div class="sc-page-subtitle">
        <RichText html={data.process.descriptionHtml} />
      </div>

      <div class="sc-section sc-entity-card">
        <InlineEntityFlagControl
          action="?/createFlag"
          targetType="process"
          targetId={data.process.id}
          entityLabel={data.process.name}
          viewerRole={data.viewerRole}
          errorMessage={form?.createFlagError}
          errorTargetType={form?.createFlagTargetType}
          errorTargetId={form?.createFlagTargetId}
        />
        <div class="sc-process-details-grid">
          <div class="sc-process-facts sc-process-facts--stack">
            <div class="sc-card sc-process-fact">
              <div class="sc-process-fact-label">Trigger</div>
              <div class="sc-process-fact-value">
                {data.process.trigger || "Not set"}
              </div>
            </div>
            <div class="sc-card sc-process-fact">
              <div class="sc-process-fact-label">End State</div>
              <div class="sc-process-fact-value">
                {data.process.endState || "Not set"}
              </div>
            </div>
          </div>
          <div class="sc-process-facts sc-process-facts--stack">
            <div class="sc-card sc-process-fact">
              <div class="sc-process-fact-label">Who Does It</div>
              <div class="sc-byline">
                {#if actionRoles.length === 0}
                  <span class="sc-page-subtitle">No action owners yet.</span>
                {:else}
                  {#each actionRoles as role}
                    <RolePortal {role} />
                  {/each}
                {/if}
              </div>
            </div>
            <div class="sc-card sc-process-fact">
              <div class="sc-process-fact-label">What Systems</div>
              <div class="sc-byline">
                {#if actionSystems.length === 0}
                  <span class="sc-page-subtitle">No systems linked yet.</span>
                {:else}
                  {#each actionSystems as system}
                    <SystemPortal {system} />
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sc-section">
        <div class="flex justify-between items-center gap-4 flex-wrap">
          <div class="sc-section-title">What Happens?</div>
          <button
            class="sc-btn mb-2"
            type="button"
            onclick={openCreateActionModal}
          >
            Write an Action
          </button>
        </div>
        {#each actions as action}
          <div
            class="sc-card sc-entity-card sc-action-card sc-action-card-clickable"
            role="button"
            tabindex="0"
            aria-label={`Edit Action ${action.sequence}`}
            onclick={(event) => openEditActionModal(event, action)}
            onkeydown={(event) => onActionCardKeydown(event, action)}
          >
            <InlineEntityFlagControl
              action="?/createFlag"
              targetType="action"
              targetId={action.id}
              entityLabel={`Action ${action.sequence}`}
              viewerRole={data.viewerRole}
              errorMessage={form?.createFlagError}
              errorTargetType={form?.createFlagTargetType}
              errorTargetId={form?.createFlagTargetId}
            />
            <div class="sc-action-card-main">
              <div
                style="font-size: var(--sc-font-lg); font-weight: 600; margin-top:6px;"
              >
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

  <div class="sc-section">
    <div class="sc-section-title">Traverse</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#if actionRoles.length === 0 && actionSystems.length === 0}
          <span class="sc-page-subtitle"
            >Add actions to build traversal links.</span
          >
        {:else}
          {#each actionRoles as role}
            <RolePortal {role} />
          {/each}
          {#if actionRoles.length > 0 && actionSystems.length > 0}
            <span>·</span>
          {/if}
          {#each actionSystems as system}
            <SystemPortal {system} />
          {/each}
          <span>·</span>
          <ProcessPortal process={data.process} />
        {/if}
      </div>
    </div>
  </div>

  <ScModal
    bind:open={isCreateActionModalOpen}
    title={editingActionId ? "Edit Action" : "Add Action"}
    description={editingActionId
      ? "Update this action's description, role, and system."
      : "Capture one action in this process and link role + system."}
    maxWidth="760px"
  >
    <form
      class="sc-form sc-action-modal-form"
      method="POST"
      action="?/createAction"
    >
      {#if form?.createActionError}
        <div class="sc-form-error">{form.createActionError}</div>
      {/if}
      {#if editingActionId}
        <input type="hidden" name="action_id" value={editingActionId} />
      {/if}
      <div class="sc-form-row sc-action-modal-description-row">
        <textarea
          class="sc-search sc-field sc-textarea sc-action-modal-description"
          name="description"
          bind:value={actionDescriptionDraft}
          placeholder="Action description"
          rows="4"
          required
        ></textarea>
      </div>
      <div class="sc-form-row sc-action-modal-controls-row">
        <select
          class="sc-search sc-field sc-action-modal-select"
          name="owner_role_id"
          bind:value={selectedOwnerRoleId}
          required
        >
          <option value="">Role responsible</option>
          {#each data.allRoles as role}
            <option value={role.id} selected={form?.createdRoleId === role.id}
              >{role.name}</option
            >
          {/each}
        </select>
        <button
          class="sc-btn secondary sc-action-modal-btn"
          type="button"
          onclick={() => {
            isCreateRoleModalOpen = true
          }}
        >
          Create Role
        </button>
        <select
          class="sc-search sc-field sc-action-modal-select"
          name="system_id"
          bind:value={selectedSystemId}
          required
        >
          <option value="">System</option>
          {#each data.allSystems as system}
            <option
              value={system.id}
              selected={form?.createdSystemId === system.id}
              >{system.name}</option
            >
          {/each}
        </select>
        <button
          class="sc-btn secondary sc-action-modal-btn"
          type="button"
          onclick={() => {
            isCreateSystemModalOpen = true
          }}
        >
          Create System
        </button>
      </div>
      <div class="sc-form-row sc-action-modal-submit-row">
        <button class="sc-btn" type="submit">
          {editingActionId ? "Save Action" : "Create Action"}
        </button>
      </div>
    </form>
  </ScModal>

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
