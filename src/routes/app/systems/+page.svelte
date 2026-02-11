<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"

  let { data, form } = $props()
  let isCreateSystemModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)

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
  })
</script>

<div class="sc-page">
  <div class="flex justify-between items-center gap-4 flex-wrap">
    <div class="flex flex-col">
      <div class="sc-page-title text-2xl font-bold">Systems</div>
      <div class="sc-page-subtitle">
        Track every tool your business depends on, and who owns it.
      </div>
    </div>

    <div class="sc-actions">
      <button
        class="sc-btn"
        type="button"
        onclick={() => {
          isCreateSystemModalOpen = true
        }}
      >
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
          required
        />
        <input
          class="sc-search sc-field"
          name="location"
          placeholder="Location (URL or app section)"
        />
      </div>
      <div class="sc-form-row">
        <input class="sc-search sc-field" name="url" placeholder="Public URL" />
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
      </div>
      <div class="sc-form-row">
        <textarea
          class="sc-search sc-field sc-textarea"
          name="description"
          placeholder="System description - what this system is used for"
          rows="4"
        ></textarea>
      </div>
      <div class="sc-form-actions">
        <div class="sc-page-subtitle">
          This system becomes a portal across every linked action.
        </div>
        <button class="sc-btn" type="submit">Create System</button>
      </div>
      {#if form?.createRoleSuccess}
        <div class="sc-page-subtitle">
          Role created. Select it as owner and continue creating your system.
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
          errorMessage={form?.createFlagError}
          errorTargetType={form?.createFlagTargetType}
          errorTargetId={form?.createFlagTargetId}
        />
        <div class="sc-byline">
          <SystemPortal {system} size="lg" />
          {#if system.ownerRole}
            <span>Owner</span>
            <RolePortal
              role={system.ownerRole as {
                slug: string
                name: string
                initials: string
              }}
              size="sm"
            />
          {/if}
          {#if system.location}
            <span class="sc-pill">{system.location}</span>
          {/if}
        </div>
        <div style="margin-top:10px; font-size: var(--sc-font-md);">
          <RichText html={system.descriptionHtml} />
        </div>
      </div>
    {/each}
  </div>
</div>
