<script lang="ts">
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"
  import FlagBadgeModal from "$lib/components/FlagBadgeModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import { getAvatarColor } from "$lib/colors"
  import type { DirectFlagBadgeData } from "$lib/flags"

  type RoleEntry = {
    id: string
    slug: string
    name: string
    initials: string
    descriptionHtml: string
    processCount: number
    systemCount: number
    relatedProcesses: { id: string; slug: string; name: string }[]
    relatedSystems: { id: string; slug: string; name: string }[]
    directFlagData: DirectFlagBadgeData
  }
  type Props = {
    data: {
      roles: RoleEntry[]
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

<svelte:head>
  <title>Roles</title>
</svelte:head>

<div class="sc-process-page">
  <div class="sc-process-layout sc-process-layout--single">
    <div class="sc-process-main">
      <div class="sc-page-head">
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
        <form
          class="sc-form"
          method="POST"
          action="?/createRole"
          use:pendingEnhance
        >
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
            <button
              class="sc-btn"
              type="submit"
              data-loading-label="Creating..."
            >
              Create Role
            </button>
          </div>
        </form>
      </ScModal>

      {#if data.roles.length === 0}
        <div class="sc-section">
          <div class="sc-card">
            <div class="sc-page-subtitle">
              No roles yet. Add your first role to define ownership.
            </div>
          </div>
        </div>
      {:else}
        <div class="sc-section sc-entity-list-grid">
          {#each data.roles as role}
            <article
              class="sc-card sc-entity-card sc-card-interactive sc-role-card sc-entity-family-card"
            >
              <a
                href={`/app/roles/${role.slug}`}
                class="sc-entity-card-overlay"
                aria-label={`Open role ${role.name}`}
                tabindex="-1"
              ></a>

              <div class="sc-entity-card-body">
                <div class="sc-role-title-row">
                  <div class="sc-section-title sc-role-card-title">
                    <span
                      class="sc-avatar"
                      style={`--avatar-size:34px;--avatar-font:13px; --avatar-bg: ${getAvatarColor(role.name)};`}
                      >{role.initials}</span
                    >
                    <span class="sc-role-title-text">{role.name}</span>
                  </div>

                  <div class="sc-role-card-actions">
                    <FlagBadgeModal
                      kind="direct"
                      label={`${role.name} direct flags`}
                      data={role.directFlagData}
                      viewerRole={data.org.membershipRole}
                      modalTitle={`${role.name} flags`}
                      modalDescription="Open flags attached directly to this role."
                    />
                    <InlineEntityFlagControl
                      inline={true}
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
                  </div>
                </div>

                <div class="sc-role-summary-row" aria-label="Role relationship summary">
                  <details class="sc-rel-group">
                    <summary>
                      <span>Processes</span>
                      <strong>{role.processCount}</strong>
                    </summary>
                    <div class="sc-rel-links">
                      {#if role.relatedProcesses.length === 0}
                        <span class="sc-page-subtitle">No linked processes</span>
                      {:else}
                        {#each role.relatedProcesses as process}
                          <ProcessPortal {process} />
                        {/each}
                      {/if}
                    </div>
                  </details>

                  <details class="sc-rel-group">
                    <summary>
                      <span>Systems</span>
                      <strong>{role.systemCount}</strong>
                    </summary>
                    <div class="sc-rel-links">
                      {#if role.relatedSystems.length === 0}
                        <span class="sc-page-subtitle">No linked systems</span>
                      {:else}
                        {#each role.relatedSystems as system}
                          <SystemPortal {system} size="sm" />
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
  .sc-role-card {
    min-height: 0;
  }

  .sc-role-card :global(.sc-entity-card-overlay) {
    z-index: 2;
  }

  .sc-role-card :global(.sc-entity-card-body) {
    z-index: auto;
    pointer-events: none;
  }

  .sc-role-title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    pointer-events: none;
  }

  .sc-role-card-title {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0;
    min-width: 0;
    flex: 1 1 auto;
  }

  .sc-role-title-text {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    text-wrap: balance;
  }

  .sc-role-card-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
    pointer-events: auto;
    position: relative;
    z-index: 3;
  }

  .sc-role-summary-row {
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
    min-width: 168px;
    max-width: 240px;
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

  .sc-rel-links :global(.sc-portal) {
    font-size: var(--sc-font-sm);
    color: var(--sc-text-muted);
    text-decoration: none;
  }

  .sc-rel-links :global(.sc-portal:hover),
  .sc-rel-links :global(.sc-portal:focus-visible) {
    color: var(--sc-green);
    text-decoration: underline;
  }

  @media (max-width: 740px) {
    .sc-role-title-row {
      flex-wrap: wrap;
    }

    .sc-rel-links {
      left: auto;
      right: 0;
    }
  }
</style>
