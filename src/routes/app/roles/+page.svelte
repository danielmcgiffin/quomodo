<script lang="ts">
  import RichText from "$lib/components/RichText.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

  import RolePortal from "$lib/components/RolePortal.svelte"

  type RoleEntry = {
    id: string
    slug: string
    name: string
    initials: string
    descriptionHtml: string
    processCount: number
    systemCount: number
    ownerRole: { id: string; slug: string; name: string; initials: string } | null
  }
  type Props = {
    data: {
      roles: RoleEntry[]
      openFlags: {
        id: string
        flagType: string
        createdAt: string
        message: string
        targetPath: string | null
        role: { slug: string; name: string }
      }[]
      org: { membershipRole: "owner" | "admin" | "editor" | "member" }
    }
    form?: {
      createRoleError?: string
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
  let isCreateRoleModalOpen = $state(false)
  let roleNameDraft = $state("")
  let roleDescriptionDraft = $state("")
  let roleDescriptionRichDraft = $state("")

  const roleFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
  ]

  const openCreateRoleModal = () => {
    roleNameDraft = ""
    roleDescriptionDraft = ""
    roleDescriptionRichDraft = ""
    isCreateRoleModalOpen = true
  }

  $effect(() => {
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
    if (typeof form?.roleNameDraft === "string") {
      roleNameDraft = form.roleNameDraft
    }
    if (typeof form?.roleDescriptionDraft === "string") {
      roleDescriptionDraft = form.roleDescriptionDraft
    }
    if (typeof form?.roleDescriptionRichDraft === "string") {
      roleDescriptionRichDraft = form.roleDescriptionRichDraft
    }
  })
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <div class="flex justify-between items-center gap-4 flex-wrap">
        <div class="flex flex-col">
          <div class="sc-page-title text-2xl font-bold">Roles</div>
          <div class="sc-page-subtitle">
            Define ownership clearly so responsibilities stop drifting.
          </div>
        </div>

        <div class="sc-actions">
          <button class="sc-btn" type="button" onclick={openCreateRoleModal}>
            Make a Role
          </button>
        </div>
      </div>

      <ScModal
        bind:open={isCreateRoleModalOpen}
        title="Add Role"
        description="Capture who owns what. Role name is required."
        maxWidth="760px"
      >
        <form class="sc-form" method="POST" action="?/createRole">
          {#if form?.createRoleError}
            <div class="sc-form-error">{form.createRoleError}</div>
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
            <RichTextEditor
              fieldName="description_rich"
              textFieldName="description"
              bind:textValue={roleDescriptionDraft}
              bind:richValue={roleDescriptionRichDraft}
            />
          </div>
          <div class="sc-form-actions">
            <div class="sc-page-subtitle">
              This role becomes a portal across the atlas.
            </div>
            <button class="sc-btn" type="submit">Create Role</button>
          </div>
        </form>
      </ScModal>

      <div class="sc-section">
        {#each data.roles as role}
          <div class="sc-card sc-entity-card sc-card-interactive">
            <InlineEntityFlagControl
              action="?/createFlag"
              targetType="role"
              targetId={role.id}
              entityLabel={role.name}
              viewerRole={data.org.membershipRole}
              fieldTargets={roleFieldTargets}
              errorMessage={form?.createFlagError}
              errorTargetType={form?.createFlagTargetType}
              errorTargetId={form?.createFlagTargetId}
              errorTargetPath={form?.createFlagTargetPath}
            />
            <a
              href={`/app/roles/${role.slug}`}
              class="block"
              aria-label={`Open role ${role.name}`}
            >
              <div
                class="sc-section-title flex items-center gap-3"
                style="margin-bottom: 0;"
              >
                <span
                  class="sc-avatar"
                  style="--avatar-size:36px;--avatar-font:14px;"
                  >{role.initials}</span
                >
                <span class="min-w-0 truncate">{role.name}</span>
              </div>
              <div class="sc-byline sc-stack-top-12">
                {#if role.ownerRole}
                  <span>Reports to</span>
                  <div class="relative z-10 pointer-events-auto">
                    <RolePortal role={role.ownerRole} size="sm" />
                  </div>
                {/if}
                <span class="sc-pill">{role.processCount} processes</span>
                <span class="sc-pill">{role.systemCount} systems</span>
              </div>
            </a>
          </div>
        {/each}
      </div>
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
        highlightedFlagId={null}
      />
    </aside>
  </div>
</div>
