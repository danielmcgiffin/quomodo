<script lang="ts">
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import RoleDetailHeader from "$lib/components/RoleDetailHeader.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"
  import RoleProcessGraph from "$lib/components/RoleProcessGraph.svelte"

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

  const roleFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
  ]

  const canManageRole = () =>
    data.org.membershipRole === "owner" || data.org.membershipRole === "admin"

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
        <div class="sc-card">
          <RoleProcessGraph role={data.role} actionsByProcess={data.actionsByProcess} />
        </div>
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
