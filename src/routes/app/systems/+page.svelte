<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"

  let { data, form } = $props()
  let isCreateSystemModalOpen = $state(false)

  $effect(() => {
    if (form?.createSystemError) {
      isCreateSystemModalOpen = true
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
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
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
    </form>
  </ScModal>

  <div class="sc-section">
    {#each data.systems as system}
      <div class="sc-card">
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
