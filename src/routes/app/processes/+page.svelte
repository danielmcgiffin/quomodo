<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"

  let { data, form } = $props()
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

<div class="sc-page flex justify-between items-center">
  <div class="flex flex-col">
    <div class="sc-page-title text-2xl font-bold">Processes</div>
    <div class="sc-page-subtitle">
      Write down how your work works, and save yourself the headache later.
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

  <div class="sc-section">
    {#each data.processes as process}
      <div class="sc-card sc-entity-card">
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
        <div class="sc-section-title">
          <a
            class="sc-portal sc-portal-process"
            href={`/app/processes/${process.slug}`}
          >
            {process.name}
          </a>
        </div>
        <div class="sc-page-subtitle">
          <RichText html={process.descriptionHtml} />
        </div>
        <div class="sc-byline" style="margin-top:10px;">
          {#if process.ownerRole}
            <RolePortal role={process.ownerRole} size="sm" />
          {/if}
          {#if process.primarySystem}
            <span>· in</span>
            <SystemPortal system={process.primarySystem} size="sm" />
          {/if}
          {#if process.trigger}
            <span>·</span>
          {/if}
          <span>{process.trigger}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
