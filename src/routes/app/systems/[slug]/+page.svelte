<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  type Props = {
    data: {
      system: {
        slug: string
        name: string
        descriptionHtml: string
        location: string
        url: string
      }
      processesUsing: { id: string; slug: string; name: string }[]
      actionsUsing: {
        id: string
        processId: string
        sequence: number
        descriptionHtml: string
        ownerRole: { slug: string; name: string; initials: string } | null
      }[]
      rolesUsing: { slug: string; name: string; initials: string }[]
      systemFlags: { id: string; flagType: string; message: string }[]
    }
  }

  let { data }: Props = $props()
</script>

<div class="sc-page">
  <div class="sc-page-title">{data.system.name}</div>
  <div class="sc-page-subtitle">
    <RichText html={data.system.descriptionHtml} />
  </div>

  <div class="sc-section">
    <div class="sc-section-title">System Details</div>
    <div class="sc-card">
      <div class="sc-byline">
        <SystemPortal system={data.system} size="lg" />
        {#if data.system.url}
          <a class="sc-portal-process" href={data.system.url} target="_blank">
            {data.system.url.replace("https://", "")}
          </a>
        {/if}
        {#if data.system.location}
          <span class="sc-pill">{data.system.location}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Uses This?</div>
    {#each data.processesUsing as process}
      <div class="sc-card">
        <ProcessPortal {process} />
        {#each data.actionsUsing.filter((action: { processId: string }) => action.processId === process.id) as action}
          <div style="margin-top:8px;">
            <div class="sc-meta">Action {action.sequence}</div>
            <RichText html={action.descriptionHtml} />
            <div class="sc-byline" style="margin-top:6px;">
              {#if action.ownerRole}
                <RolePortal role={action.ownerRole} />
              {/if}
              <span>· in</span>
              <SystemPortal system={data.system} size="sm" />
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Who Has Access?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.rolesUsing as role}
          <RolePortal {role} />
        {/each}
      </div>
    </div>
  </div>

  {#if data.systemFlags.length}
    <div class="sc-section">
      <div class="sc-section-title">What's Broken?</div>
      {#each data.systemFlags as flag}
        <div class="sc-card sc-card-flag">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          <div style="margin-top:10px;">{flag.message}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>
