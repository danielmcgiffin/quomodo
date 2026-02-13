<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

  type Props = {
    data: {
      org: { membershipRole: "owner" | "admin" | "editor" | "member" }
      system: {
        id: string
        slug: string
        name: string
        descriptionRich: string
        descriptionHtml: string
        location: string
        ownerRole: {
          id: string
          slug: string
          name: string
          initials: string
        } | null
      }
      allRoles: { id: string; slug: string; name: string; initials: string }[]
      processesUsing: { id: string; slug: string; name: string }[]
      actionsUsing: {
        id: string
        processId: string
        sequence: number
        descriptionHtml: string
        ownerRole: { slug: string; name: string; initials: string } | null
      }[]
      rolesUsing: { slug: string; name: string; initials: string }[]
      systemFlags: { id: string; flagType: string; message: string }[]
      openFlags: {
        id: string
        flagType: string
        createdAt: string
        message: string
        targetPath: string | null
        system: { slug: string; name: string }
      }[]
      highlightedFlagId: string | null
    }
    form?: {
      updateSystemError?: string
      deleteSystemError?: string
      createFlagError?: string
      createFlagTargetType?: string
      createFlagTargetId?: string
      createFlagTargetPath?: string
      systemNameDraft?: string
      systemDescriptionDraft?: string
      systemDescriptionRichDraft?: string
      systemLocationDraft?: string
      selectedOwnerRoleIdDraft?: string
    }
  }

  let { data, form }: Props = $props()
  let isEditSystemModalOpen = $state(false)
  let systemNameDraft = $state("")
  let systemLocationDraft = $state("")
  let systemDescriptionDraft = $state("")
  let systemDescriptionRichDraft = $state("")
  let selectedOwnerRoleId = $state("")
  let selectedUsageProcessId = $state("")
  let selectedUsageRoleSlug = $state("")

  const systemFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
    { path: "location", label: "Location" },
    { path: "owner_role_id", label: "Owner role" },
  ]

  const htmlToDraftText = (html: string): string =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim()

  const canManageSystem = () =>
    data.org.membershipRole === "owner" || data.org.membershipRole === "admin"

  const filteredActionsUsing = $derived.by(() =>
    data.actionsUsing.filter((action) => {
      if (
        selectedUsageProcessId &&
        action.processId !== selectedUsageProcessId
      ) {
        return false
      }
      if (
        selectedUsageRoleSlug &&
        action.ownerRole?.slug !== selectedUsageRoleSlug
      ) {
        return false
      }
      return true
    }),
  )
  const actionsByProcess = $derived.by(() => {
    const processById = new Map(
      data.processesUsing.map((process) => [process.id, process]),
    )
    const grouped = new Map<
      string,
      {
        process: (typeof data.processesUsing)[number]
        actions: (typeof data.actionsUsing)[number][]
      }
    >()

    for (const action of filteredActionsUsing) {
      const process = processById.get(action.processId)
      if (!process) {
        continue
      }
      const existing = grouped.get(process.id) ?? { process, actions: [] }
      existing.actions.push(action)
      grouped.set(process.id, existing)
    }

    if (selectedUsageProcessId && !grouped.has(selectedUsageProcessId)) {
      const selectedProcess = processById.get(selectedUsageProcessId)
      if (selectedProcess) {
        grouped.set(selectedUsageProcessId, {
          process: selectedProcess,
          actions: [],
        })
      }
    }

    return Array.from(grouped.values())
  })
  const totalUsageCount = $derived.by(() => data.actionsUsing.length)
  const filteredUsageCount = $derived.by(() => filteredActionsUsing.length)

  const setSystemDraftsFromData = () => {
    systemNameDraft = data.system.name
    systemLocationDraft = data.system.location
    systemDescriptionDraft = htmlToDraftText(data.system.descriptionHtml)
    systemDescriptionRichDraft = data.system.descriptionRich
    selectedOwnerRoleId = data.system.ownerRole?.id ?? ""
  }

  const openEditSystemModal = () => {
    setSystemDraftsFromData()
    isEditSystemModalOpen = true
  }

  const confirmDeleteSystem = (event: SubmitEvent) => {
    const shouldDelete = confirm(
      "Delete this system? Roles and processes keep their records, but actions linked to this system must be reassigned first.",
    )
    if (!shouldDelete) {
      event.preventDefault()
    }
  }

  $effect(() => {
    if (form?.updateSystemError) {
      isEditSystemModalOpen = true
    }
    systemNameDraft =
      typeof form?.systemNameDraft === "string"
        ? form.systemNameDraft
        : data.system.name
    systemDescriptionDraft =
      typeof form?.systemDescriptionDraft === "string"
        ? form.systemDescriptionDraft
        : htmlToDraftText(data.system.descriptionHtml)
    systemDescriptionRichDraft =
      typeof form?.systemDescriptionRichDraft === "string"
        ? form.systemDescriptionRichDraft
        : data.system.descriptionRich
    systemLocationDraft =
      typeof form?.systemLocationDraft === "string"
        ? form.systemLocationDraft
        : data.system.location
    selectedOwnerRoleId =
      typeof form?.selectedOwnerRoleIdDraft === "string"
        ? form.selectedOwnerRoleIdDraft
        : (data.system.ownerRole?.id ?? "")
  })
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <div class="flex justify-between items-start gap-4 flex-wrap">
        <div class="flex flex-col">
          <div class="sc-page-title">{data.system.name}</div>
          <div class="sc-page-subtitle">
            <RichText html={data.system.descriptionHtml} />
          </div>
        </div>

        {#if canManageSystem()}
          <div class="sc-actions">
            <button
              class="sc-btn secondary"
              type="button"
              onclick={openEditSystemModal}
            >
              Edit System
            </button>
            <form
              method="POST"
              action="?/deleteSystem"
              onsubmit={confirmDeleteSystem}
            >
              <input type="hidden" name="system_id" value={data.system.id} />
              <button class="sc-btn secondary" type="submit"
                >Delete System</button
              >
            </form>
          </div>
        {/if}
      </div>

      {#if form?.deleteSystemError}
        <div class="sc-form-error sc-stack-top-10">
          {form.deleteSystemError}
        </div>
      {/if}

      <ScModal
        bind:open={isEditSystemModalOpen}
        title="Edit System"
        description="Update ownership and context for this system."
        maxWidth="760px"
      >
        <form class="sc-form" method="POST" action="?/updateSystem">
          <input type="hidden" name="system_id" value={data.system.id} />
          {#if form?.updateSystemError}
            <div class="sc-form-error">{form.updateSystemError}</div>
          {/if}
          <div class="sc-form-row">
            <input
              class="sc-search sc-field"
              name="name"
              placeholder="System name"
              bind:value={systemNameDraft}
              required
            />
            <input
              class="sc-search sc-field"
              name="location"
              placeholder="Location (URL or app section)"
              bind:value={systemLocationDraft}
            />
          </div>
          <div class="sc-form-row">
            <select
              class="sc-search sc-field"
              name="owner_role_id"
              bind:value={selectedOwnerRoleId}
            >
              <option value="">Owner role (optional)</option>
              {#each data.allRoles as role}
                <option value={role.id}>{role.name}</option>
              {/each}
            </select>
          </div>
          <div class="sc-form-row">
            <RichTextEditor
              fieldName="description_rich"
              textFieldName="description"
              htmlValue={data.system.descriptionHtml}
              bind:textValue={systemDescriptionDraft}
              bind:richValue={systemDescriptionRichDraft}
            />
          </div>
          <div class="sc-form-actions">
            <div class="sc-page-subtitle">
              Owner linkage updates immediately for system detail and
              traversals.
            </div>
            <button class="sc-btn" type="submit">Save System</button>
          </div>
        </form>
      </ScModal>

      <div class="sc-section">
        <div class="sc-section-title">System Details</div>
        <div class="sc-card sc-entity-card">
          <InlineEntityFlagControl
            action="?/createFlag"
            targetType="system"
            targetId={data.system.id}
            entityLabel={data.system.name}
            viewerRole={data.org.membershipRole}
            fieldTargets={systemFieldTargets}
            errorMessage={form?.createFlagError}
            errorTargetType={form?.createFlagTargetType}
            errorTargetId={form?.createFlagTargetId}
            errorTargetPath={form?.createFlagTargetPath}
          />
          <div class="sc-byline">
            <SystemPortal system={data.system} size="lg" />
            {#if data.system.ownerRole}
              <span>Owner</span>
              <RolePortal role={data.system.ownerRole} size="sm" />
            {/if}
            {#if data.system.location}
              <span class="sc-pill">{data.system.location}</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="sc-section">
        <div class="sc-section-title">What Uses This?</div>
        <div class="sc-form-row">
          <select
            class="sc-search sc-field"
            bind:value={selectedUsageProcessId}
          >
            <option value="">All processes</option>
            {#each data.processesUsing as process}
              <option value={process.id}>{process.name}</option>
            {/each}
          </select>
          <select class="sc-search sc-field" bind:value={selectedUsageRoleSlug}>
            <option value="">All roles</option>
            {#each data.rolesUsing as role}
              <option value={role.slug}>{role.name}</option>
            {/each}
          </select>
        </div>
        <div class="sc-page-subtitle sc-stack-top-8">
          Showing {filteredUsageCount} of {totalUsageCount} actions.
        </div>

        {#if actionsByProcess.length === 0}
          <div class="sc-card sc-stack-top-8">
            <div class="sc-page-subtitle">
              No actions match the selected filters.
            </div>
          </div>
        {:else}
          {#each actionsByProcess as entry}
            <div class="sc-card">
              <ProcessPortal process={entry.process} />
              {#if entry.actions.length === 0}
                <div class="sc-stack-top-8 sc-muted-line">
                  No actions match the selected filters.
                </div>
              {:else}
                {#each entry.actions as action}
                  <div class="sc-stack-top-8">
                    <div class="sc-meta">Action {action.sequence}</div>
                    <RichText html={action.descriptionHtml} />
                    <div class="sc-byline sc-stack-top-6">
                      {#if action.ownerRole}
                        <RolePortal role={action.ownerRole} />
                      {/if}
                      <span>· in</span>
                      <SystemPortal system={data.system} size="sm" />
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <div class="sc-section">
        <div class="sc-section-title">Who Has Access?</div>
        <div class="sc-card">
          <div class="sc-byline">
            {#each data.rolesUsing as role}
              <RolePortal {role} />
            {/each}
          </div>
        </div>
      </div>

      {#if data.systemFlags.length}
        <div class="sc-section">
          <div class="sc-section-title">What's Broken?</div>
          {#each data.systemFlags as flag}
            <div class="sc-card sc-card-flag">
              <div class="sc-flag-banner">
                ⚑ {flag.flagType.replace("_", " ")}
              </div>
              <div class="sc-stack-top-10">{flag.message}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <aside class="sc-process-sidebar">
      <FlagSidebar
        title="Flags"
        flags={data.openFlags.map((flag) => ({
          id: flag.id,
          href: `/app/systems/${flag.system.slug}?flagId=${flag.id}`,
          flagType: flag.flagType ?? "flag",
          createdAt: flag.createdAt,
          message: flag.message,
          context: flag.system.name,
          targetPath: flag.targetPath ?? undefined,
        }))}
        highlightedFlagId={data.highlightedFlagId}
      />
    </aside>
  </div>
</div>
