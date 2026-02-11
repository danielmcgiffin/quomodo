<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"

  let { data, form } = $props()
  let isCreateRoleModalOpen = $state(false)

  $effect(() => {
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
  })
</script>

<div class="sc-page">
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
        onclick={() => {
          isCreateRoleModalOpen = true
        }}
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
          required
        />
      </div>
      <div class="sc-form-row">
        <input
          class="sc-search sc-field"
          name="person_name"
          placeholder="Person name (optional)"
        />
        <input
          class="sc-search sc-field"
          name="hours_per_week"
          placeholder="Hours per week (optional)"
        />
      </div>
      <div class="sc-form-row">
        <textarea
          class="sc-search sc-field sc-textarea"
          name="description"
          placeholder="Role description - what this role owns and why it exists"
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
          errorMessage={form?.createFlagError}
          errorTargetType={form?.createFlagTargetType}
          errorTargetId={form?.createFlagTargetId}
        />
        <div class="sc-byline">
          <RolePortal {role} size="lg" />
          {#if role.personName}
            <span class="sc-pill">{role.personName}</span>
          {/if}
          {#if role.hoursPerWeek !== null}
            <span class="sc-pill">{role.hoursPerWeek} hrs/week</span>
          {/if}
        </div>
        <div style="margin-top:10px; font-size: var(--sc-font-md);">
          <RichText html={role.descriptionHtml} />
        </div>
      </div>
    {/each}
  </div>
</div>
