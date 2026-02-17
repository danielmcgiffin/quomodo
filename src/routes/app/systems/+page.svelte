<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"

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
        processCount: number
        roleCount: number
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

  function isValidUrl(str: string) {
    if (!str) return false
    try {
      const url = new URL(str)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      return str.startsWith("http://") || str.startsWith("https://")
    }
  }

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
        <form
          class="sc-form"
          method="POST"
          action="?/createSystem"
          use:pendingEnhance
        >
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
            <button
              class="sc-btn"
              type="submit"
              data-loading-label="Creating..."
            >
              Create System
            </button>
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
          <div class="sc-card sc-entity-card relative group">
            <div class="relative z-10">
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
              {#if isValidUrl(system.location)}
                <a
                  href={system.location}
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
            </div>

            <a
              href={`/app/systems/${system.slug}`}
              class="absolute inset-0 z-0 focus:outline-none"
              aria-label={`Open system ${system.name}`}
              tabindex="-1"
            ></a>

            <div class="block">
              <div class="sc-byline relative pointer-events-none">
                <div class="relative z-10 pointer-events-auto">
                  <SystemPortal {system} size="lg" />
                </div>
                {#if system.ownerRole}
                  <span>Owner</span>
                  <div class="relative z-10 pointer-events-auto">
                    <RolePortal role={system.ownerRole} size="sm" />
                  </div>
                {/if}
                <span class="sc-pill relative z-10 pointer-events-auto"
                  >{system.processCount} processes</span
                >
                <span class="sc-pill relative z-10 pointer-events-auto"
                  >{system.roleCount} roles</span
                >
              </div>
            </div>
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
