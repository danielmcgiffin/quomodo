<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

  type RoleEntry = {
    id: string
    slug: string
    name: string
    initials: string
    descriptionHtml: string
    personName: string
    hoursPerWeek: number | null
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
      rolePersonNameDraft?: string
      roleHoursPerWeekDraft?: string
      roleDescriptionDraft?: string
    }
  }

  let { data, form }: Props = $props()
  let isCreateRoleModalOpen = $state(false)
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

  const openCreateRoleModal = () => {
    roleNameDraft = ""
    rolePersonNameDraft = ""
    roleHoursPerWeekDraft = ""
    roleDescriptionDraft = ""
    isCreateRoleModalOpen = true
  }

  $effect(() => {
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
    if (typeof form?.roleNameDraft === "string") {
      roleNameDraft = form.roleNameDraft
    }
    if (typeof form?.rolePersonNameDraft === "string") {
      rolePersonNameDraft = form.rolePersonNameDraft
    }
    if (typeof form?.roleHoursPerWeekDraft === "string") {
      roleHoursPerWeekDraft = form.roleHoursPerWeekDraft
    }
    if (typeof form?.roleDescriptionDraft === "string") {
      roleDescriptionDraft = form.roleDescriptionDraft
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
          <button
            class="sc-btn"
            type="button"
            onclick={openCreateRoleModal}
          >
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
              This role becomes a portal across the atlas.
            </div>
            <button class="sc-btn" type="submit">Create Role</button>
          </div>
        </form>
      </ScModal>

      <div class="sc-section">
        {#each data.roles as role}
          <div class="sc-card sc-entity-card">
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
              <div class="sc-byline">
                <RolePortal {role} size="lg" />
                {#if role.personName}
                  <span class="sc-pill">{role.personName}</span>
                {/if}
                {#if role.hoursPerWeek !== null}
                  <span class="sc-pill">{role.hoursPerWeek} hrs/week</span>
                {/if}
              </div>
              <div class="sc-copy-md">
                <RichText html={role.descriptionHtml} />
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
