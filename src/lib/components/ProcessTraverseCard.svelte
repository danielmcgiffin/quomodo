<script lang="ts">
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"

  type Role = {
    id: string
    slug: string
    name: string
    initials: string
  }
  type System = {
    id: string
    slug: string
    name: string
  }

  let {
    process,
    actionRoles,
    actionSystems,
  }: {
    process: { id: string; slug: string; name: string }
    actionRoles: Role[]
    actionSystems: System[]
  } = $props()
</script>

<div class="sc-section">
  <div class="sc-section-title">Traverse</div>
  <div class="sc-card">
    <div class="sc-byline">
      {#if actionRoles.length === 0 && actionSystems.length === 0}
        <span class="sc-page-subtitle"
          >Add actions to build traversal links.</span
        >
      {:else}
        {#each actionRoles as role}
          <RolePortal {role} />
        {/each}
        {#if actionRoles.length > 0 && actionSystems.length > 0}
          <span>·</span>
        {/if}
        {#each actionSystems as system}
          <SystemPortal {system} />
        {/each}
        <span>·</span>
        <ProcessPortal {process} />
      {/if}
    </div>
  </div>
</div>
