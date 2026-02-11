<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  let { data, form } = $props()
</script>

<div class="sc-page">
  <div class="sc-page-title">Processes</div>
  <div class="sc-page-subtitle">
    Every process is an entry point into the atlas.
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Add Process</div>
    <form class="sc-card" method="POST" action="?/createProcess">
      {#if form?.createProcessError}
        <div style="color: var(--sc-danger); margin-bottom: 10px;">{form.createProcessError}</div>
      {/if}
      <div class="sc-byline" style="margin-bottom:10px;">
        <input class="sc-search" name="name" placeholder="Process name" required />
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <input class="sc-search" name="trigger" placeholder="Trigger" />
        <input class="sc-search" name="end_state" placeholder="End state" />
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
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
          placeholder="Process description"
          rows="3"
        ></textarea>
      </div>
      <button class="sc-btn" type="submit">Create Process</button>
    </form>
  </div>

  <div class="sc-section">
    {#each data.processes as process}
      <div class="sc-card">
        <div class="sc-section-title">
          <a class="sc-portal sc-portal-process" href={`/app/processes/${process.slug}`}>
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
