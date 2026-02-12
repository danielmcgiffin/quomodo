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
        url: string
        ownerRole: { id: string; slug: string; name: string; initials: string } | null
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
      systemUrlDraft?: string
      selectedOwnerRoleIdDraft?: string
    }
  }

  let { data, form }: Props = $props()
  let isEditSystemModalOpen = $state(false)
  let systemNameDraft = $state("")
  let systemLocationDraft = $state("")
  let systemUrlDraft = $state("")
  let systemDescriptionDraft = $state("")
  let systemDescriptionRichDraft = $state("")
  let selectedOwnerRoleId = $state("")

  const systemFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
    { path: "location", label: "Location" },
    { path: "url", label: "URL" },
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

  const setSystemDraftsFromData = () => {
    systemNameDraft = data.system.name
    systemLocationDraft = data.system.location
    systemUrlDraft = data.system.url
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
    systemUrlDraft =
      typeof form?.systemUrlDraft === "string" ? form.systemUrlDraft : data.system.url
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
            <form method="POST" action="?/deleteSystem" onsubmit={confirmDeleteSystem}>
              <input type="hidden" name="system_id" value={data.system.id} />
              <button class="sc-btn secondary" type="submit">Delete System</button>
            </form>
          </div>
        {/if}
      </div>

      {#if form?.deleteSystemError}
        <div class="sc-form-error sc-stack-top-10">{form.deleteSystemError}</div>
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
            <input
              class="sc-search sc-field"
              name="url"
              placeholder="Public URL"
              bind:value={systemUrlDraft}
            />
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
              Owner linkage updates immediately for system detail and traversals.
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
            {#if data.system.url}
              <a class="sc-portal-process" href={data.system.url} target="_blank">
                {data.system.url.replace("https://", "")}
              </a>
            {/if}
            {#if data.system.location}
              <span class="sc-pill">{data.system.location}</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="sc-section">
        <div class="sc-section-title">What Uses This?</div>
        {#each data.processesUsing as process}
          <div class="sc-card">
            <ProcessPortal {process} />
            {#each data.actionsUsing.filter((action: { processId: string }) => action.processId === process.id) as action}
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
          </div>
        {/each}
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
