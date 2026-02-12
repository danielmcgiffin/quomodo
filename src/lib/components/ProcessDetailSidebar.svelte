<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"

  type SidebarRole = {
    id: string
    slug: string
    name: string
    initials: string
  }

  let {
    relatedRoles,
    relatedHandlesWithoutRole,
  }: {
    relatedRoles: SidebarRole[]
    relatedHandlesWithoutRole: string[]
  } = $props()
</script>

<div class="sc-process-sidebar-sections">
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
</div>
