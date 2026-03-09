<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import FlagBadgeModal from "$lib/components/FlagBadgeModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"
  import type { DirectFlagBadgeData, RelatedFlagBadgeData } from "$lib/flags"

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
        relatedProcesses: { id: string; slug: string; name: string }[]
        relatedRoles: { id: string; slug: string; name: string; initials: string }[]
        directFlagData: DirectFlagBadgeData
        relatedFlagData: RelatedFlagBadgeData
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

<svelte:head>
  <title>Systems</title>
</svelte:head>

<div class="sc-process-page">
  <div class="sc-process-layout sc-process-layout--single">
    <div class="sc-process-main">
      <div class="sc-page-head">
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

      {#if data.systems.length === 0}
        <div class="sc-section">
          <div class="sc-card">
            <div class="sc-page-subtitle">
              No systems yet. Record your first system to map dependencies.
            </div>
          </div>
        </div>
      {:else}
        <div class="sc-section sc-entity-list-grid">
          {#each data.systems as system}
            <article class="sc-card sc-entity-card sc-card-interactive sc-entity-family-card sc-system-card">
              <a
                href={`/app/systems/${system.slug}`}
                class="sc-entity-card-overlay"
                aria-label={`Open system ${system.name}`}
                tabindex="-1"
              ></a>

              <div class="sc-entity-card-body">
                <div class="sc-system-title-row">
                  <div class="sc-section-title sc-system-card-heading">
                    <SystemPortal system={system} size="lg" disableLink={true} />
                  </div>

                  <div class="sc-system-title-actions">
                    <FlagBadgeModal
                      kind="direct"
                      label={`${system.name} direct flags`}
                      data={system.directFlagData}
                      viewerRole={data.org.membershipRole}
                      modalTitle={`${system.name} flags`}
                      modalDescription="Open flags attached directly to this system."
                    />
                    <FlagBadgeModal
                      kind="related"
                      label={`${system.name} related flags`}
                      data={system.relatedFlagData}
                      viewerRole={data.org.membershipRole}
                      modalTitle={`${system.name} related flags`}
                      modalDescription="Open flags on visible linked entities on this card."
                    />
                    <InlineEntityFlagControl
                      inline={true}
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
                        class="sc-location-btn sc-location-btn--inline"
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
                      </a>
                    {/if}
                  </div>
                </div>

                <div class="sc-system-summary-row" aria-label="System relationship summary">
                  <details class="sc-rel-group">
                    <summary>
                      <span>Owner</span>
                      <strong>{system.ownerRole ? system.ownerRole.name : "Unassigned"}</strong>
                    </summary>
                    <div class="sc-rel-links">
                      {#if system.ownerRole}
                        <RolePortal role={system.ownerRole} size="sm" />
                      {:else}
                        <span class="sc-page-subtitle">No owner assigned</span>
                      {/if}
                    </div>
                  </details>

                  <details class="sc-rel-group">
                    <summary>
                      <span>Processes</span>
                      <strong>{system.processCount}</strong>
                    </summary>
                    <div class="sc-rel-links">
                      {#if system.relatedProcesses.length === 0}
                        <span class="sc-page-subtitle">No linked processes</span>
                      {:else}
                        {#each system.relatedProcesses as process}
                          <a href={`/app/processes/${process.slug}`}>{process.name}</a>
                        {/each}
                      {/if}
                    </div>
                  </details>

                  <details class="sc-rel-group">
                    <summary>
                      <span>Roles</span>
                      <strong>{system.roleCount}</strong>
                    </summary>
                    <div class="sc-rel-links">
                      {#if system.relatedRoles.length === 0}
                        <span class="sc-page-subtitle">No linked roles</span>
                      {:else}
                        {#each system.relatedRoles as role}
                          <a href={`/app/roles/${role.slug}`}>{role.name}</a>
                        {/each}
                      {/if}
                    </div>
                  </details>
                </div>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sc-system-card {
    min-height: 0;
  }

  .sc-system-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    pointer-events: auto;
  }

  .sc-system-card-heading {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0;
    min-width: 0;
    flex: 1 1 auto;
  }

  :global(.sc-system-card-heading .sc-portal-name) {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    text-wrap: balance;
  }

  .sc-system-title-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
    position: relative;
    z-index: 3;
    pointer-events: auto;
  }

  .sc-system-summary-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    pointer-events: auto;
    position: relative;
    z-index: 3;
  }

  .sc-rel-group {
    position: relative;
  }

  .sc-rel-group summary {
    list-style: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: var(--sc-radius-full);
    border: 1px solid var(--sc-border);
    background: var(--sc-bg-inset);
    color: var(--sc-text-muted);
    font-size: var(--sc-font-sm);
    font-weight: 600;
    cursor: pointer;
    max-width: 220px;
  }

  .sc-rel-group summary::-webkit-details-marker {
    display: none;
  }

  .sc-rel-group summary:hover,
  .sc-rel-group summary:focus-visible {
    border-color: var(--sc-green-border);
    color: var(--sc-green-dark);
  }

  .sc-rel-links {
    display: none;
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    min-width: 176px;
    max-width: 250px;
    max-height: 180px;
    overflow: auto;
    padding: 8px;
    border-radius: var(--sc-radius-md);
    border: 1px solid var(--sc-border);
    background: var(--sc-white);
    box-shadow: var(--sc-shadow-card);
    z-index: 5;
  }

  .sc-rel-group:hover .sc-rel-links,
  .sc-rel-group:focus-within .sc-rel-links,
  .sc-rel-group[open] .sc-rel-links {
    display: grid;
    gap: 6px;
  }

  .sc-rel-links a {
    font-size: var(--sc-font-sm);
    color: var(--sc-text-muted);
    text-decoration: none;
  }

  .sc-rel-links a:hover,
  .sc-rel-links a:focus-visible {
    color: var(--sc-green);
    text-decoration: underline;
  }

  .sc-location-btn--inline {
    position: static;
    height: 28px;
    width: 28px;
    min-width: 28px;
    padding: 0;
    opacity: 1;
    pointer-events: auto;
  }

  @media (max-width: 740px) {
    .sc-system-title-row {
      flex-wrap: wrap;
    }

    .sc-rel-links {
      left: auto;
      right: 0;
    }
  }
</style>
