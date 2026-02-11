<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  let { data, form } = $props()
</script>

<div class="sc-page">
  <div class="sc-page-title">Roles</div>
  <div class="sc-page-subtitle">
    Ownership lives here. Every avatar is a portal.
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Add Role</div>
    <form class="sc-card" method="POST" action="?/createRole">
      {#if form?.createRoleError}
        <div style="color: var(--sc-danger); margin-bottom: 10px;">{form.createRoleError}</div>
      {/if}
      <div class="sc-byline" style="margin-bottom:10px;">
        <input class="sc-search" name="name" placeholder="Role name" required />
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <input class="sc-search" name="person_name" placeholder="Person name" />
        <input class="sc-search" name="hours_per_week" placeholder="Hours/week" />
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <textarea
          class="sc-search"
          name="description"
          placeholder="Role description"
          rows="3"
        ></textarea>
      </div>
      <button class="sc-btn" type="submit">Create Role</button>
    </form>
  </div>

  <div class="sc-section">
    {#each data.roles as role}
      <div class="sc-card">
        <div class="sc-byline">
          <RolePortal role={role} size="lg" />
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
