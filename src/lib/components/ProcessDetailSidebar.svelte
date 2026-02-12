<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"

  type SidebarRole = {
    id: string
    slug: string
    name: string
    initials: string
  }

  type SidebarSystem = {
    id: string
    slug: string
    name: string
  }

  let {
    actionRoles,
    actionSystems,
    relatedRoles,
    relatedHandlesWithoutRole,
  }: {
    actionRoles: SidebarRole[]
    actionSystems: SidebarSystem[]
    relatedRoles: SidebarRole[]
    relatedHandlesWithoutRole: string[]
  } = $props()
</script>

<aside class="sc-process-sidebar">
  <div class="sc-section">
    <div class="sc-section-title sc-sidebar-title">Who Does It</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#if actionRoles.length === 0}
          <span class="sc-page-subtitle">No action owners yet.</span>
        {:else}
          {#each actionRoles as role}
            <RolePortal {role} />
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title sc-sidebar-title">What Systems</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#if actionSystems.length === 0}
          <span class="sc-page-subtitle">No systems linked yet.</span>
        {:else}
          {#each actionSystems as system}
            <SystemPortal {system} />
          {/each}
        {/if}
      </div>
    </div>
  </div>

  {#if relatedRoles.length > 0 || relatedHandlesWithoutRole.length > 0}
    <div class="sc-section">
      <div class="sc-section-title sc-sidebar-title">Related Roles</div>
      <div class="sc-card">
        <div class="sc-byline">
          {#each relatedRoles as role}
            <RolePortal {role} />
          {/each}
          {#each relatedHandlesWithoutRole as handle}
            <span class="sc-pill">@{handle}</span>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</aside>
