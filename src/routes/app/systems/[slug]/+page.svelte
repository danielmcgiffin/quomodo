<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import SystemDetailHeader from "$lib/components/SystemDetailHeader.svelte"
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
  let selectedUsageProcessId = $state("")
  let selectedUsageRoleSlug = $state("")

  const systemFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
    { path: "location", label: "Location" },
    { path: "owner_role_id", label: "Owner role" },
  ]

  const canManageSystem = () =>
    data.org.membershipRole === "owner" || data.org.membershipRole === "admin"

  function isValidUrl(str: string) {
    if (!str) return false
    try {
      const url = new URL(str)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return str.startsWith("http://") || str.startsWith("https://")
    }
  }

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

  // Draft handling + edit modal are encapsulated in SystemDetailHeader to keep the page lean.
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <SystemDetailHeader
        system={data.system}
        allRoles={data.allRoles}
        canEdit={canManageSystem()}
        {form}
      />

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
          <div class="sc-byline sc-stack-top-12">
            <SystemPortal system={data.system} size="lg" />
            {#if data.system.ownerRole}
              <span>Owner</span>
              <RolePortal role={data.system.ownerRole} size="sm" />
            {/if}
          </div>
          {#if isValidUrl(data.system.location)}
            <a
              href={data.system.location}
              target="_blank"
              rel="noopener noreferrer"
              class="sc-location-btn"
              title="Visit system"
            >
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M10 3H13V6" />
                <path d="M8 8L13 3" />
                <path
                  d="M9 13H4C3.44772 13 3 12.5523 3 12V7C3 6.44772 3.44772 6 4 6H6"
                />
              </svg>
              <span>Link</span>
            </a>
          {/if}
          <div class="sc-copy-md">
            <RichText html={data.system.descriptionHtml} />
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
