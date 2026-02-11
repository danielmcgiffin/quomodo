<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineCreateSystemModal from "$lib/components/InlineCreateSystemModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"

  let { data, form } = $props()
  let isCreateActionModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)
  let isCreateSystemModalOpen = $state(false)

  $effect(() => {
    if (
      form?.createActionError ||
      form?.createRoleError ||
      form?.createRoleSuccess ||
      form?.createSystemError ||
      form?.createSystemSuccess
    ) {
      isCreateActionModalOpen = true
    }
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
    if (form?.createSystemError) {
      isCreateSystemModalOpen = true
    }
  })
</script>

<div class="sc-page">
  <div class="sc-page-title">{data.process.name}</div>
  <div class="sc-page-subtitle">
    <RichText html={data.process.descriptionHtml} />
  </div>

  <div class="sc-section">
    <div class="flex justify-between">
      <div class="sc-section-title">Process Details</div>
      <span class="sc-byline">Actions ({data.actions.length})</span>
    </div>
    <div class="sc-card sc-entity-card">
      <InlineEntityFlagControl
        action="?/createFlag"
        targetType="process"
        targetId={data.process.id}
        entityLabel={data.process.name}
        viewerRole={data.viewerRole}
        errorMessage={form?.createFlagError}
        errorTargetType={form?.createFlagTargetType}
        errorTargetId={form?.createFlagTargetId}
      />
      <div class="sc-byline">
        <span>Trigger: {data.process.trigger}</span>
        <span>·</span>
        <span>End State: {data.process.endState}</span>
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Who's Involved?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.roles as role}
          <RolePortal {role} />
        {/each}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Systems?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.systems as system}
          <SystemPortal {system} />
        {/each}
      </div>
    </div>
  </div>

  {#if data.processFlags.length}
    <div class="sc-section">
      <div class="sc-section-title">What's Broken?</div>
      {#each data.processFlags as flag}
        <div class="sc-card sc-card-flag">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          <div style="margin-top:10px;">{flag.message}</div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="sc-section">
    <div class="sc-section-title">What Happens?</div>
    {#each data.actions as action}
      <div class="sc-card sc-entity-card">
        <InlineEntityFlagControl
          action="?/createFlag"
          targetType="action"
          targetId={action.id}
          entityLabel={`Action ${action.sequence}`}
          viewerRole={data.viewerRole}
          errorMessage={form?.createFlagError}
          errorTargetType={form?.createFlagTargetType}
          errorTargetId={form?.createFlagTargetId}
        />
        <div class="sc-meta">Action {action.sequence}</div>
        <div
          style="font-size: var(--sc-font-lg); font-weight: 600; margin-top:6px;"
        >
          <RichText html={action.descriptionHtml} />
        </div>
        <div class="sc-byline" style="margin-top:10px;">
          {#if action.ownerRole}
            <RolePortal
              role={action.ownerRole as {
                slug: string
                name: string
                initials: string
              }}
            />
          {/if}
          {#if action.system}
            <span>· in</span>
            <SystemPortal
              system={action.system as { slug: string; name: string }}
            />
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="sc-section">
    <div class="flex justify-between items-center gap-4 flex-wrap">
      <div class="sc-section-title">Add Action</div>
      <button
        class="sc-btn"
        type="button"
        onclick={() => {
          isCreateActionModalOpen = true
        }}
      >
        Write an Action
      </button>
    </div>
  </div>

  <ScModal
    bind:open={isCreateActionModalOpen}
    title="Add Action"
    description="Capture one action in this process and link role + system."
    maxWidth="760px"
  >
    <form class="sc-form" method="POST" action="?/createAction">
      {#if form?.createActionError}
        <div class="sc-form-error">{form.createActionError}</div>
      {/if}
      <div class="sc-form-row">
        <input
          class="sc-search sc-field"
          name="sequence"
          placeholder="Sequence (optional)"
        />
      </div>
      <div class="sc-form-row">
        <select class="sc-search sc-field" name="owner_role_id" required>
          <option value="">Role responsible</option>
          {#each data.allRoles as role}
            <option value={role.id} selected={form?.createdRoleId === role.id}
              >{role.name}</option
            >
          {/each}
        </select>
        <select class="sc-search sc-field" name="system_id" required>
          <option value="">System</option>
          {#each data.allSystems as system}
            <option
              value={system.id}
              selected={form?.createdSystemId === system.id}
              >{system.name}</option
            >
          {/each}
        </select>
      </div>
      <div class="sc-form-row">
        <button
          class="sc-btn secondary"
          type="button"
          onclick={() => {
            isCreateRoleModalOpen = true
          }}
        >
          Create Role
        </button>
        <button
          class="sc-btn secondary"
          type="button"
          onclick={() => {
            isCreateSystemModalOpen = true
          }}
        >
          Create System
        </button>
      </div>
      <div class="sc-form-row">
        <textarea
          class="sc-search sc-field sc-textarea"
          name="description"
          placeholder="Action description"
          rows="4"
          required
        ></textarea>
      </div>
      <div class="sc-form-actions">
        <div class="sc-page-subtitle">
          Actions appear in sequence and become part of portal traversal.
        </div>
        <button class="sc-btn" type="submit">Create Action</button>
      </div>
      {#if form?.createRoleSuccess}
        <div class="sc-page-subtitle">
          Role created. It is preselected above.
        </div>
      {/if}
      {#if form?.createSystemSuccess}
        <div class="sc-page-subtitle">
          System created. It is preselected above.
        </div>
      {/if}
    </form>
  </ScModal>

  <InlineCreateRoleModal
    bind:open={isCreateRoleModalOpen}
    action="?/createRole"
    errorMessage={form?.createRoleError}
    description="Create a role without leaving action authoring."
    helperText="This role is immediately available for action ownership."
  />

  <InlineCreateSystemModal
    bind:open={isCreateSystemModalOpen}
    action="?/createSystem"
    roles={data.allRoles}
    selectedRoleId={form?.createdRoleId}
    errorMessage={form?.createSystemError}
    description="Create a system without leaving action authoring."
    helperText="This system is immediately available for action linking."
  />

  <div class="sc-section">
    <div class="sc-section-title">Traverse</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.roles as role}
          <RolePortal {role} />
        {/each}
        <span>·</span>
        {#each data.systems as system}
          <SystemPortal {system} />
        {/each}
        <span>·</span>
        <ProcessPortal process={data.process} />
      </div>
    </div>
  </div>
</div>
