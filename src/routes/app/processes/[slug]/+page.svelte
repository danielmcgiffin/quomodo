<script lang="ts">
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"
  import ProcessActionsPanel from "$lib/components/ProcessActionsPanel.svelte"
  import ProcessDetailHeader from "$lib/components/ProcessDetailHeader.svelte"
  import ProcessOverviewCard from "$lib/components/ProcessOverviewCard.svelte"
  import ProcessTraverseCard from "$lib/components/ProcessTraverseCard.svelte"

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
    processDescriptionRichDraft?: string
    processTriggerDraft?: string
    processEndStateDraft?: string
    selectedProcessOwnerRoleIdDraft?: string
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
  type ProcessData = {
    process: {
      id: string
      slug: string
      name: string
      descriptionRich: string
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

  const canEditProcess = $derived.by(() => data.viewerRole !== "member")

  const actionRoles = $derived.by(() =>
    data.actions
      .map((action) => action.ownerRole)
      .filter((role): role is SidebarRole => Boolean(role)),
  )
  const actionSystems = $derived.by(() =>
    data.actions
      .map((action) => action.system)
      .filter((system): system is SidebarSystem => Boolean(system)),
  )
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main">
      <ProcessDetailHeader
        process={data.process}
        allRoles={data.allRoles}
        canEdit={canEditProcess}
        {form}
      />

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

      <ProcessActionsPanel
        actions={data.actions}
        allRoles={data.allRoles}
        allSystems={data.allSystems}
        viewerRole={data.viewerRole}
        highlightedActionId={data.highlightedActionId}
        {form}
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
</div>
