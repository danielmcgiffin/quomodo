<script lang="ts">
  import { systems, roleById } from "$lib/data/atlas"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
</script>

<div class="sc-page">
  <div class="sc-page-title">Systems</div>
  <div class="sc-page-subtitle">
    Every system shows its blast radius in the atlas.
  </div>

  <div class="sc-section">
    {#each systems as system}
      <div class="sc-card">
        <div class="sc-byline">
          <SystemPortal system={system} size="lg" />
          {#if system.adminRoleId}
            <span>Admin</span>
            <RolePortal role={roleById.get(system.adminRoleId)!} size="sm" />
          {/if}
          {#if system.location}
            <span class="sc-pill">{system.location}</span>
          {/if}
          {#if system.costMonthly}
            <span class="sc-pill">${system.costMonthly}/mo</span>
          {/if}
        </div>
        <div style="margin-top:10px; font-size: var(--sc-font-md);">
          <RichText html={system.descriptionHtml} />
        </div>
      </div>
    {/each}
  </div>
</div>
