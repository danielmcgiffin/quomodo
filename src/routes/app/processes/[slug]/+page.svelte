<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  let { data } = $props()
</script>

  <div class="sc-page">
    <div class="sc-page-title">{data.process.name}</div>
    <div class="sc-page-subtitle">
      <RichText html={data.process.descriptionHtml} />
    </div>

  <div class="sc-section">
    <div class="sc-section-title">Process Details</div>
    <div class="sc-card">
      <div class="sc-byline">
        <span>Trigger: {data.process.trigger}</span>
        <span>·</span>
        <span>End State: {data.process.endState}</span>
        <span>·</span>
        <span>Actions ({data.actions.length})</span>
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Who's Involved?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.roles as role}
          <RolePortal role={role} />
        {/each}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Systems?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.systems as system}
          <SystemPortal system={system} />
        {/each}
      </div>
    </div>
  </div>

  {#if data.processFlags.length}
    <div class="sc-section">
      <div class="sc-section-title">What's Broken?</div>
      {#each data.processFlags as flag}
        <div class="sc-card sc-card-flag">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          <div style="margin-top:10px;">{flag.message}</div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="sc-section">
    <div class="sc-section-title">What Happens?</div>
    {#each data.actions as action}
      <div class="sc-card">
        <div class="sc-meta">Action {action.sequence}</div>
        <div style="font-size: var(--sc-font-lg); font-weight: 600; margin-top:6px;">
          <RichText html={action.descriptionHtml} />
        </div>
        <div class="sc-byline" style="margin-top:10px;">
          <RolePortal role={action.ownerRole} />
          <span>· in</span>
          <SystemPortal system={action.system} />
        </div>
      </div>
    {/each}
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Traverse</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.roles as role}
          <RolePortal role={role} />
        {/each}
        <span>·</span>
        {#each data.systems as system}
          <SystemPortal system={system} />
        {/each}
        <span>·</span>
        <ProcessPortal process={data.process} />
      </div>
    </div>
  </div>
</div>
