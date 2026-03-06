<script lang="ts">
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import RoleDetailHeader from "$lib/components/RoleDetailHeader.svelte"
  import CopyLinkButton from "$lib/components/CopyLinkButton.svelte"
  import FlagBadgeModal from "$lib/components/FlagBadgeModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import { getAvatarColor } from "$lib/colors"
  import type { DirectFlagBadgeData, RelatedFlagBadgeData } from "$lib/flags"

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
      actionsByProcess: {
        process: { id: string; slug: string; name: string }
        actions: {
          id: string
          sequence: number
          descriptionHtml: string
          system: { id: string; slug: string; name: string } | null
        }[]
      }[]
      systemsAccessed: { id: string; slug: string; name: string }[]
      roleDirectFlagData: DirectFlagBadgeData
      actionsRelatedFlagData: RelatedFlagBadgeData
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
  let activeTab = $state<"actions" | "details">("actions")

  const roleFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
  ]

  const canManageRole = () =>
    data.org.membershipRole === "owner" || data.org.membershipRole === "admin"

  const totalActionCount = $derived.by(() =>
    data.actionsByProcess.reduce(
      (count, entry) => count + entry.actions.length,
      0,
    ),
  )
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <div class="sc-page-head sc-role-detail-head">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="sc-role-title-wrap">
            <span
              class="sc-avatar sc-role-avatar-large"
              style={`--avatar-bg: ${getAvatarColor(data.role.name)};`}
              >{data.role.initials}</span
            >
            <div class="min-w-0">
              <div class="sc-role-title-row">
                <div class="sc-page-title">{data.role.name}</div>
                <FlagBadgeModal
                  kind="direct"
                  label={`${data.role.name} direct flags`}
                  data={data.roleDirectFlagData}
                  viewerRole={data.org.membershipRole}
                  modalTitle={`${data.role.name} flags`}
                  modalDescription="Open flags attached directly to this role."
                />
                <div class="sc-role-title-icons">
                  <CopyLinkButton
                    variant="icon"
                    href={`/app/roles/${data.role.slug}`}
                    label="Copy role link"
                  />
                  <InlineEntityFlagControl
                    inline={true}
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
                </div>
              </div>
              <div class="sc-page-subtitle">
                Everything this role does, grouped by process.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="sc-tabs sc-stack-top-12"
        role="tablist"
        aria-label="Role views"
      >
        <div class="sc-tab-wrap">
          <button
            class={`sc-tab ${activeTab === "actions" ? "is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === "actions"}
            onclick={() => {
              activeTab = "actions"
            }}
          >
            Actions
          </button>
          <FlagBadgeModal
            kind="related"
            label={`${data.role.name} related action flags`}
            data={data.actionsRelatedFlagData}
            viewerRole={data.org.membershipRole}
            modalTitle={`${data.role.name} related flags`}
            modalDescription="Open flags on the linked processes and systems visible in this tab."
          />
        </div>
        <div class="sc-tab-wrap">
          <button
            class={`sc-tab ${activeTab === "details" ? "is-active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            onclick={() => {
              activeTab = "details"
            }}
          >
            Role Details
          </button>
        </div>
      </div>

      {#if activeTab === "actions"}
        <div class="sc-section sc-stack-top-8">
          <div class="sc-page-subtitle">
            {totalActionCount} actions across connected processes.
          </div>

          {#if data.actionsByProcess.length === 0}
            <div class="sc-card sc-stack-top-8">
              <div class="sc-page-subtitle">
                No actions are connected to this role yet.
              </div>
            </div>
          {:else}
            {#each data.actionsByProcess as entry}
              <div
                class="sc-card sc-role-process-card"
                id={`process-${entry.process.slug}`}
              >
                <div class="sc-meta">
                  <ProcessPortal process={entry.process} />
                </div>

                {#if entry.actions.length === 0}
                  <div class="sc-stack-top-8 sc-muted-line">
                    No direct actions recorded.
                  </div>
                {:else}
                  <div class="sc-role-action-grid">
                    {#each entry.actions as action}
                      <article class="sc-card sc-role-action-card">
                        <div class="sc-action-label">
                          Action {action.sequence}
                        </div>
                        <div class="sc-stack-top-8">
                          <RichText html={action.descriptionHtml} />
                        </div>
                        {#if action.system}
                          <div class="sc-stack-top-8">
                            <SystemPortal system={action.system} size="sm" />
                          </div>
                        {/if}
                      </article>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {:else}
        <div class="sc-section sc-stack-top-8">
          <RoleDetailHeader
            role={data.role}
            canEdit={canManageRole()}
            showTitle={false}
            showActions={true}
            {form}
          />

          <div class="sc-section sc-stack-top-8">
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
        </div>
      {/if}
    </div>

    <aside class="sc-process-sidebar">
      <div class="sc-section">
        <div class="sc-section-title sc-sidebar-title">Systems</div>
        {#if data.systemsAccessed.length === 0}
          <div class="sc-card sc-flags-sidebar-placeholder">
            <div class="sc-page-subtitle">No connected systems yet.</div>
          </div>
        {:else}
          <div class="sc-card">
            <div class="sc-byline">
              {#each data.systemsAccessed as system}
                <SystemPortal {system} />
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </aside>
  </div>
</div>

<style>
  .sc-role-detail-head {
    margin-bottom: 0;
  }

  .sc-tab-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .sc-role-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .sc-role-avatar-large {
    --avatar-size: 48px;
    --avatar-font: 18px;
    flex-shrink: 0;
  }

  .sc-role-title-wrap .sc-page-title {
    margin-bottom: 0;
  }

  .sc-role-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
  }

  .sc-role-title-icons {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .sc-role-process-card {
    margin-top: 12px;
  }

  .sc-role-action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .sc-role-action-card {
    margin-top: 0;
    background: var(--sc-bg-inset);
    border-color: var(--sc-border);
    padding: 12px;
  }
</style>
