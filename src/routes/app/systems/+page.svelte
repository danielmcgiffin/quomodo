<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

  type Props = {
    data: {
      org: { membershipRole: "owner" | "admin" | "editor" | "member" }
      roles: { id: string; name: string }[]
      systems: {
        id: string
        slug: string
        name: string
        descriptionHtml: string
        location: string
        ownerRole: {
          id: string
          slug: string
          name: string
          initials: string
        } | null
      }[]
      openFlags: {
        id: string
        flagType: string
        createdAt: string
        message: string
        targetPath: string | null
        system: { slug: string; name: string }
      }[]
    }
    form?: {
      createSystemError?: string
      createRoleError?: string
      createRoleSuccess?: boolean
      createdRoleId?: string
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
  let isCreateSystemModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)
  let systemNameDraft = $state("")
  let systemLocationDraft = $state("")
  let systemDescriptionDraft = $state("")
  let systemDescriptionRichDraft = $state("")
  let selectedOwnerRoleId = $state("")

  const systemFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
    { path: "location", label: "Location" },
    { path: "owner_role_id", label: "Owner role" },
  ]

  const openCreateSystemModal = () => {
    systemNameDraft = ""
    systemLocationDraft = ""
    systemDescriptionDraft = ""
    systemDescriptionRichDraft = ""
    selectedOwnerRoleId = form?.createdRoleId ?? ""
    isCreateSystemModalOpen = true
  }

  $effect(() => {
    if (
      form?.createSystemError ||
      form?.createRoleError ||
      form?.createRoleSuccess
    ) {
      isCreateSystemModalOpen = true
    }
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
    if (typeof form?.systemNameDraft === "string") {
      systemNameDraft = form.systemNameDraft
    }
    if (typeof form?.systemDescriptionDraft === "string") {
      systemDescriptionDraft = form.systemDescriptionDraft
    }
    if (typeof form?.systemDescriptionRichDraft === "string") {
      systemDescriptionRichDraft = form.systemDescriptionRichDraft
    }
    if (typeof form?.systemLocationDraft === "string") {
      systemLocationDraft = form.systemLocationDraft
    }
    if (typeof form?.selectedOwnerRoleIdDraft === "string") {
      selectedOwnerRoleId = form.selectedOwnerRoleIdDraft
    }
    if (form?.createdRoleId) {
      selectedOwnerRoleId = form.createdRoleId
    }
  })
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <div class="flex justify-between items-center gap-4 flex-wrap">
        <div class="flex flex-col">
          <div class="sc-page-title text-2xl font-bold">Systems</div>
          <div class="sc-page-subtitle">
            Track every tool your business depends on, and who owns it.
          </div>
        </div>

        <div class="sc-actions">
          <button class="sc-btn" type="button" onclick={openCreateSystemModal}>
            Record a System
          </button>
        </div>
      </div>

      <ScModal
        bind:open={isCreateSystemModalOpen}
        title="Add System"
        description="Capture the system details and ownership. System name is required."
        maxWidth="760px"
      >
        <form class="sc-form" method="POST" action="?/createSystem">
          {#if form?.createSystemError}
            <div class="sc-form-error">{form.createSystemError}</div>
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
              {#each data.roles as role}
                <option
                  value={role.id}
                  selected={form?.createdRoleId === role.id}>{role.name}</option
                >
              {/each}
            </select>
            <button
              class="sc-btn secondary"
              type="button"
              onclick={() => {
                isCreateRoleModalOpen = true
              }}
            >
              Create Role
            </button>
          </div>
          <div class="sc-form-row">
            <RichTextEditor
              fieldName="description_rich"
              textFieldName="description"
              bind:textValue={systemDescriptionDraft}
              bind:richValue={systemDescriptionRichDraft}
            />
          </div>
          <div class="sc-form-actions">
            <div class="sc-page-subtitle">
              This system becomes a portal across every linked action.
            </div>
            <button class="sc-btn" type="submit">Create System</button>
          </div>
          {#if form?.createRoleSuccess}
            <div class="sc-page-subtitle">
              Role created. Select it as owner and continue creating your
              system.
            </div>
          {/if}
        </form>
      </ScModal>

      <InlineCreateRoleModal
        bind:open={isCreateRoleModalOpen}
        action="?/createRole"
        errorMessage={form?.createRoleError}
        description="Create a role without leaving system creation."
        helperText="This role is immediately available as system owner."
      />

      <div class="sc-section">
        {#each data.systems as system}
          <div class="sc-card sc-entity-card">
            <InlineEntityFlagControl
              action="?/createFlag"
              targetType="system"
              targetId={system.id}
              entityLabel={system.name}
              viewerRole={data.org.membershipRole}
              fieldTargets={systemFieldTargets}
              errorMessage={form?.createFlagError}
              errorTargetType={form?.createFlagTargetType}
              errorTargetId={form?.createFlagTargetId}
              errorTargetPath={form?.createFlagTargetPath}
            />
            <a
              href={`/app/systems/${system.slug}`}
              class="block"
              aria-label={`Open system ${system.name}`}
            >
              <div class="sc-byline">
                <SystemPortal {system} size="lg" />
                {#if system.ownerRole}
                  <span>Owner</span>
                  <RolePortal role={system.ownerRole} size="sm" />
                {/if}
                {#if system.location}
                  <span class="sc-pill">{system.location}</span>
                {/if}
              </div>
              <div class="sc-copy-md">
                <RichText html={system.descriptionHtml} />
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
          href: `/app/systems/${flag.system.slug}?flagId=${flag.id}`,
          flagType: flag.flagType ?? "flag",
          createdAt: flag.createdAt,
          message: flag.message,
          context: flag.system.name,
          targetPath: flag.targetPath ?? undefined,
        }))}
        highlightedFlagId={null}
      />
    </aside>
  </div>
</div>
