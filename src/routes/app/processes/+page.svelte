<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"

  type RoleBadge = { id: string; slug: string; name: string; initials: string }
  type SystemBadge = { id: string; slug: string; name: string }
  type ProcessCard = {
    id: string
    slug: string
    name: string
    descriptionHtml: string
    roleBadges: RoleBadge[]
    systemBadges: SystemBadge[]
  }
  type OpenFlag = {
    id: string
    flagType: string
    createdAt: string
    message: string
    targetPath: string | null
    process: { slug: string; name: string }
  }
  type Props = {
    data: {
      org: { membershipRole: "owner" | "admin" | "editor" | "member" }
      roles: { id: string; name: string }[]
      processes: ProcessCard[]
      openFlags: OpenFlag[]
    }
    form?: {
      createProcessError?: string
      createRoleError?: string
      createRoleSuccess?: boolean
      createdRoleId?: string
      createFlagError?: string
      createFlagTargetType?: string
      createFlagTargetId?: string
    }
  }

  let { data, form }: Props = $props()
  let isCreateProcessModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)

  $effect(() => {
    if (
      form?.createProcessError ||
      form?.createRoleError ||
      form?.createRoleSuccess
    ) {
      isCreateProcessModalOpen = true
    }
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
  })
</script>

<div class="sc-process-page">
  <ScModal
    bind:open={isCreateProcessModalOpen}
    title="Add Process"
    description="Capture key info about the process. All fields required."
    maxWidth="760px"
  >
    <form class="sc-form" method="POST" action="?/createProcess">
      {#if form?.createProcessError}
        <div class="sc-form-error">{form.createProcessError}</div>
      {/if}
      <div class="sc-form-row">
        <input
          class="sc-search sc-field"
          name="name"
          placeholder="Process name"
          required
        />
      </div>
      <div class="sc-form-row">
        <textarea
          class="sc-search sc-field sc-textarea"
          name="description"
          placeholder="Process description - an explanation about why you do the process"
          rows="4"
        ></textarea>
      </div>
      <div class="sc-form-row">
        <textarea
          class="sc-search sc-field sc-textarea"
          name="trigger"
          placeholder="Trigger - What event or schedule kicks off the process?"
          rows="3"
        ></textarea>
        <textarea
          class="sc-search sc-field sc-textarea"
          name="end_state"
          placeholder="Outcome - What should be different at the end of the process?"
          rows="3"
        ></textarea>
      </div>
      <div class="sc-form-actions">
        <select class="sc-search sc-field" name="owner_role_id">
          <option value="">Owner role (optional)</option>
          {#each data.roles as role}
            <option value={role.id} selected={form?.createdRoleId === role.id}
              >{role.name}</option
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
        <button class="sc-btn" type="submit">Create Process</button>
      </div>
      {#if form?.createRoleSuccess}
        <div class="sc-page-subtitle">
          Role created. Select it as owner and continue creating your process.
        </div>
      {/if}
    </form>
  </ScModal>

  <InlineCreateRoleModal
    bind:open={isCreateRoleModalOpen}
    action="?/createRole"
    errorMessage={form?.createRoleError}
    description="Create a role without leaving process creation."
    helperText="This role is immediately available as process owner."
  />

  <div class="sc-process-layout">
    <div class="sc-process-main">
      <div class="sc-page-head">
        <div class="flex flex-col">
          <div class="sc-page-title text-2xl font-bold">Processes</div>
          <div class="sc-page-subtitle">
            Write down how your work works, and save yourself the headache
            later.
          </div>
        </div>

        <div class="sc-actions">
          <button
            class="sc-btn"
            type="button"
            onclick={() => {
              isCreateProcessModalOpen = true
            }}
          >
            Write a Process
          </button>
        </div>
      </div>
      <div class="sc-section">
        {#if data.processes.length === 0}
          <div class="sc-card">
            <div class="sc-page-subtitle">
              No processes yet. Start by writing your first process.
            </div>
          </div>
        {:else}
          {#each data.processes as process}
            <article
              class="sc-card sc-entity-card sc-process-card sc-card-interactive"
            >
              <InlineEntityFlagControl
                action="?/createFlag"
                targetType="process"
                targetId={process.id}
                entityLabel={process.name}
                viewerRole={data.org.membershipRole}
                errorMessage={form?.createFlagError}
                errorTargetType={form?.createFlagTargetType}
                errorTargetId={form?.createFlagTargetId}
              />
              <a
                class="sc-process-card-link"
                href={`/app/processes/${process.slug}`}
              >
                <div class="sc-process-card-content">
                  <div class="sc-process-card-info">
                    <div class="sc-section-title">
                      <span class="sc-portal sc-portal-process">
                        {process.name}
                      </span>
                    </div>
                    <div class="sc-page-subtitle">
                      <RichText html={process.descriptionHtml} />
                    </div>
                  </div>

                  <div class="sc-process-badge-rows">
                    <div class="sc-process-badge-row">
                      <span class="sc-process-badge-label">Roles</span>
                      <div class="sc-process-badges">
                        {#if process.roleBadges.length === 0}
                          <span class="sc-page-subtitle">None</span>
                        {:else}
                          {#each process.roleBadges as role}
                            <span class="sc-process-badge" title={role.name}>
                              <RolePortal {role} size="sm" showName={false} />
                            </span>
                          {/each}
                        {/if}
                      </div>
                    </div>

                    <div class="sc-process-badge-row">
                      <span class="sc-process-badge-label">Systems</span>
                      <div class="sc-process-badges">
                        {#if process.systemBadges.length === 0}
                          <span class="sc-page-subtitle">None</span>
                        {:else}
                          {#each process.systemBadges as system}
                            <span class="sc-process-badge" title={system.name}>
                              <SystemPortal
                                {system}
                                size="sm"
                                showName={false}
                              />
                            </span>
                          {/each}
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </article>
          {/each}
        {/if}
      </div>
    </div>

    <aside class="sc-process-sidebar">
      <FlagSidebar
        title="Flags"
        flags={data.openFlags.map((flag) => ({
          id: flag.id,
          href: `/app/processes/${flag.process.slug}?flagId=${flag.id}`,
          flagType: flag.flagType ?? "flag",
          createdAt: flag.createdAt,
          message: flag.message,
          context: flag.process.name,
          targetPath: flag.targetPath ?? undefined,
        }))}
        highlightedFlagId={null}
      />
    </aside>
  </div>
</div>
