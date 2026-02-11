<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  let { data, form } = $props()
</script>

<div class="sc-page">
  <div class="sc-page-title">Systems</div>
  <div class="sc-page-subtitle">
    Every system shows its blast radius in the atlas.
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Add System</div>
    <form class="sc-card" method="POST" action="?/createSystem">
      {#if form?.createSystemError}
        <div style="color: var(--sc-danger); margin-bottom: 10px;">{form.createSystemError}</div>
      {/if}
      <div class="sc-byline" style="margin-bottom:10px;">
        <input class="sc-search" name="name" placeholder="System name" required />
        <input class="sc-search" name="location" placeholder="Location" />
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <input class="sc-search" name="url" placeholder="URL" />
        <select class="sc-search" name="owner_role_id">
          <option value="">Owner role (optional)</option>
          {#each data.roles as role}
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <textarea
          class="sc-search"
          name="description"
          placeholder="System description"
          rows="3"
        ></textarea>
      </div>
      <button class="sc-btn" type="submit">Create System</button>
    </form>
  </div>

  <div class="sc-section">
    {#each data.systems as system}
      <div class="sc-card">
        <div class="sc-byline">
          <SystemPortal system={system} size="lg" />
          {#if system.ownerRole}
            <span>Owner</span>
            <RolePortal role={system.ownerRole as any} size="sm" />
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
