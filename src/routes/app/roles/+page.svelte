<script lang="ts">
  import { roles } from "$lib/data/atlas"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
</script>

<div class="sc-page">
  <div class="sc-page-title">Roles</div>
  <div class="sc-page-subtitle">
    Ownership lives here. Every avatar is a portal.
  </div>

  <div class="sc-section">
    {#each roles as role}
      <div class="sc-card">
        <div class="sc-byline">
          <RolePortal role={role} size="lg" />
          <span class="sc-pill">{role.personName}</span>
          <span class="sc-pill">{role.hoursPerWeek} hrs/week</span>
        </div>
        <div style="margin-top:10px; font-size: var(--sc-font-md);">
          <RichText html={role.descriptionHtml} />
        </div>
      </div>
    {/each}
  </div>
</div>
