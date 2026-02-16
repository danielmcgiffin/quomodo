<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import RoleDetailHeader from "$lib/components/RoleDetailHeader.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

  type Props = {
    data: {
      role: {
        id: string
        slug: string
        name: string
        initials: string
        descriptionRich: string
        descriptionHtml: string
      }
      org: { membershipRole: "owner" | "admin" | "editor" | "member" }
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
      roleDescriptionDraft?: string
      roleDescriptionRichDraft?: string
    }
  }

  let { data, form }: Props = $props()
  let selectedActionProcessSlug = $state("")
  let selectedActionSystemSlug = $state("")

  const roleFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
  ]

  const canManageRole = () =>
    data.org.membershipRole === "owner" || data.org.membershipRole === "admin"

  const filteredActionsByProcess = $derived.by(() =>
    data.actionsByProcess
      .filter((entry) =>
        selectedActionProcessSlug
          ? entry.process.slug === selectedActionProcessSlug
          : true,
      )
      .map((entry) => ({
        ...entry,
        actions: entry.actions.filter((action) =>
          selectedActionSystemSlug
            ? action.system?.slug === selectedActionSystemSlug
            : true,
        ),
      })),
  )
  const totalActionCount = $derived.by(() =>
    data.actionsByProcess.reduce(
      (count, entry) => count + entry.actions.length,
      0,
    ),
  )
  const filteredActionCount = $derived.by(() =>
    filteredActionsByProcess.reduce(
      (count, entry) => count + entry.actions.length,
      0,
    ),
  )

  // Draft handling + edit modal are encapsulated in RoleDetailHeader to keep the page lean.
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <RoleDetailHeader role={data.role} canEdit={canManageRole()} {form} />

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
          <div class="sc-copy-md">
            <RichText html={data.role.descriptionHtml} />
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
        <div class="sc-form-row">
          <select
            class="sc-search sc-field"
            bind:value={selectedActionProcessSlug}
          >
            <option value="">All processes</option>
            {#each data.actionsByProcess as entry}
              <option value={entry.process.slug}>{entry.process.name}</option>
            {/each}
          </select>
          <select
            class="sc-search sc-field"
            bind:value={selectedActionSystemSlug}
          >
            <option value="">All systems</option>
            {#each data.systemsAccessed as system}
              <option value={system.slug}>{system.name}</option>
            {/each}
          </select>
        </div>
        <div class="sc-page-subtitle sc-stack-top-8">
          Showing {filteredActionCount} of {totalActionCount} actions.
        </div>

        {#if filteredActionsByProcess.length === 0}
          <div class="sc-card sc-stack-top-8">
            <div class="sc-page-subtitle">
              No actions match the selected filters.
            </div>
          </div>
        {:else}
          {#each filteredActionsByProcess as entry}
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
        {/if}
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
              <div class="sc-flag-banner">
                <span aria-hidden="true">⚑</span> {flag.flagType.replace("_", " ")}
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
