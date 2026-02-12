<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

  type Props = {
    data: {
      role: {
        id: string
        slug: string
        name: string
        initials: string
        descriptionHtml: string
        personName: string
        hoursPerWeek: number | null
      }
      org: { membershipRole: "owner" | "admin" | "editor" | "member" }
      reportsTo: { slug: string; name: string; initials: string } | null
      ownedProcesses: { slug: string; name: string }[]
      actionsByProcess: {
        process: { slug: string; name: string }
        actions: {
          id: string
          sequence: number
          descriptionHtml: string
          system: { slug: string; name: string } | null
        }[]
      }[]
      systemsAccessed: { slug: string; name: string }[]
      roleFlags: { id: string; flagType: string; message: string }[]
      openFlags: {
        id: string
        flagType: string
        createdAt: string
        message: string
        targetPath: string | null
        role: { slug: string; name: string }
      }[]
      highlightedFlagId: string | null
    }
    form?: {
      updateRoleError?: string
      deleteRoleError?: string
      createFlagError?: string
      createFlagTargetType?: string
      createFlagTargetId?: string
      createFlagTargetPath?: string
      roleNameDraft?: string
      rolePersonNameDraft?: string
      roleHoursPerWeekDraft?: string
      roleDescriptionDraft?: string
    }
  }

  let { data, form }: Props = $props()
  let isEditRoleModalOpen = $state(false)

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

  let roleNameDraft = $state("")
  let rolePersonNameDraft = $state("")
  let roleHoursPerWeekDraft = $state("")
  let roleDescriptionDraft = $state("")

  const roleFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
    { path: "person_name", label: "Person name" },
    { path: "hours_per_week", label: "Hours per week" },
  ]

  const canManageRole = () =>
    data.org.membershipRole === "owner" || data.org.membershipRole === "admin"

  const setRoleDraftsFromData = () => {
    roleNameDraft = data.role.name
    rolePersonNameDraft = data.role.personName ?? ""
    roleHoursPerWeekDraft =
      data.role.hoursPerWeek === null ? "" : String(data.role.hoursPerWeek)
    roleDescriptionDraft = htmlToDraftText(data.role.descriptionHtml)
  }

  const openEditRoleModal = () => {
    setRoleDraftsFromData()
    isEditRoleModalOpen = true
  }

  const confirmDeleteRole = (event: SubmitEvent) => {
    const shouldDelete = confirm(
      "Delete this role? Systems and processes will lose owner linkage, and actions assigned to this role must be reassigned first.",
    )
    if (!shouldDelete) {
      event.preventDefault()
    }
  }

  $effect(() => {
    if (form?.updateRoleError) {
      isEditRoleModalOpen = true
    }
    roleNameDraft =
      typeof form?.roleNameDraft === "string" ? form.roleNameDraft : data.role.name
    rolePersonNameDraft =
      typeof form?.rolePersonNameDraft === "string"
        ? form.rolePersonNameDraft
        : (data.role.personName ?? "")
    roleHoursPerWeekDraft =
      typeof form?.roleHoursPerWeekDraft === "string"
        ? form.roleHoursPerWeekDraft
        : (data.role.hoursPerWeek === null ? "" : String(data.role.hoursPerWeek))
    roleDescriptionDraft =
      typeof form?.roleDescriptionDraft === "string"
        ? form.roleDescriptionDraft
        : htmlToDraftText(data.role.descriptionHtml)
  })
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <div class="flex justify-between items-start gap-4 flex-wrap">
        <div class="flex flex-col">
          <div class="sc-page-title">{data.role.name}</div>
          <div class="sc-page-subtitle">
            <RichText html={data.role.descriptionHtml} />
          </div>
        </div>

        {#if canManageRole()}
          <div class="sc-actions">
            <button
              class="sc-btn secondary"
              type="button"
              onclick={openEditRoleModal}
            >
              Edit Role
            </button>
            <form method="POST" action="?/deleteRole" onsubmit={confirmDeleteRole}>
              <input type="hidden" name="role_id" value={data.role.id} />
              <button class="sc-btn secondary" type="submit">Delete Role</button>
            </form>
          </div>
        {/if}
      </div>

      {#if form?.deleteRoleError}
        <div class="sc-form-error sc-stack-top-10">{form.deleteRoleError}</div>
      {/if}

      <ScModal
        bind:open={isEditRoleModalOpen}
        title="Edit Role"
        description="Update ownership details and role context."
        maxWidth="760px"
      >
        <form class="sc-form" method="POST" action="?/updateRole">
          <input type="hidden" name="role_id" value={data.role.id} />
          {#if form?.updateRoleError}
            <div class="sc-form-error">{form.updateRoleError}</div>
          {/if}
          <div class="sc-form-row">
            <input
              class="sc-search sc-field"
              name="name"
              placeholder="Role name"
              bind:value={roleNameDraft}
              required
            />
          </div>
          <div class="sc-form-row">
            <input
              class="sc-search sc-field"
              name="person_name"
              placeholder="Person name (optional)"
              bind:value={rolePersonNameDraft}
            />
            <input
              class="sc-search sc-field"
              name="hours_per_week"
              placeholder="Hours per week (optional)"
              bind:value={roleHoursPerWeekDraft}
            />
          </div>
          <div class="sc-form-row">
            <textarea
              class="sc-search sc-field sc-textarea"
              name="description"
              placeholder="Role description - what this role owns and why it exists"
              bind:value={roleDescriptionDraft}
              rows="4"
            ></textarea>
          </div>
          <div class="sc-form-actions">
            <div class="sc-page-subtitle">
              Linked process/system views update from this role record.
            </div>
            <button class="sc-btn" type="submit">Save Role</button>
          </div>
        </form>
      </ScModal>

      <div class="sc-section">
        <div class="sc-section-title">Role Details</div>
        <div class="sc-card sc-entity-card">
          <InlineEntityFlagControl
            action="?/createFlag"
            targetType="role"
            targetId={data.role.id}
            entityLabel={data.role.name}
            viewerRole={data.org.membershipRole}
            fieldTargets={roleFieldTargets}
            errorMessage={form?.createFlagError}
            errorTargetType={form?.createFlagTargetType}
            errorTargetId={form?.createFlagTargetId}
            errorTargetPath={form?.createFlagTargetPath}
          />
          <div class="sc-byline">
            <RolePortal role={data.role} size="lg" />
            {#if data.role.personName}
              <span class="sc-pill">{data.role.personName}</span>
            {/if}
            {#if data.role.hoursPerWeek !== null}
              <span class="sc-pill">{data.role.hoursPerWeek} hrs/week</span>
            {/if}
            {#if data.reportsTo}
              <span>·</span>
              <span>Reports to</span>
              <RolePortal role={data.reportsTo} size="sm" />
            {/if}
          </div>
        </div>
      </div>

      <div class="sc-section">
        <div class="sc-section-title">What Processes?</div>
        <div class="sc-card">
          <div class="sc-byline">
            {#each data.ownedProcesses as process}
              <ProcessPortal {process} />
            {/each}
          </div>
        </div>
      </div>

      <div class="sc-section">
        <div class="sc-section-title">What Actions?</div>
        {#each data.actionsByProcess as entry}
          <div class="sc-card">
            <div class="sc-meta">
              <ProcessPortal process={entry.process} />
            </div>
            {#if entry.actions.length === 0}
              <div class="sc-stack-top-8 sc-muted-line">
                No direct actions recorded.
              </div>
            {:else}
              {#each entry.actions as action}
                <div class="sc-stack-top-10">
                  <div class="sc-action-label">Action {action.sequence}</div>
                  <RichText html={action.descriptionHtml} />
                  <div class="sc-byline sc-stack-top-6">
                    <RolePortal role={data.role} size="sm" />
                    <span>· in</span>
                    {#if action.system}
                      <SystemPortal system={action.system} size="sm" />
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {/each}
      </div>

      <div class="sc-section">
        <div class="sc-section-title">What Systems?</div>
        <div class="sc-card">
          <div class="sc-byline">
            {#each data.systemsAccessed as system}
              <SystemPortal {system} />
            {/each}
          </div>
        </div>
      </div>

      {#if data.roleFlags.length}
        <div class="sc-section">
          <div class="sc-section-title">What's Broken?</div>
          {#each data.roleFlags as flag}
            <div class="sc-card sc-card-flag">
              <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
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
          href: `/app/roles/${flag.role.slug}?flagId=${flag.id}`,
          flagType: flag.flagType ?? "flag",
          createdAt: flag.createdAt,
          message: flag.message,
          context: flag.role.name,
          targetPath: flag.targetPath ?? undefined,
        }))}
        highlightedFlagId={data.highlightedFlagId}
      />
    </aside>
  </div>
</div>
