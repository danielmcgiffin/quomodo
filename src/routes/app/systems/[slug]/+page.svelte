<script lang="ts">
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  let { data } = $props()
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
        {#if data.system.costMonthly}
          <span class="sc-pill">${data.system.costMonthly}/mo</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Uses This?</div>
    {#each data.processesUsing as process}
      <div class="sc-card">
        <ProcessPortal process={process} />
        {#each data.actionsUsing.filter((action) => action.processId === process.id) as action}
          <div style="margin-top:8px;">
            <div class="sc-meta">Action {action.sequence}</div>
            <RichText html={action.descriptionHtml} />
            <div class="sc-byline" style="margin-top:6px;">
              <RolePortal role={action.ownerRole} />
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
          <RolePortal role={role} />
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
