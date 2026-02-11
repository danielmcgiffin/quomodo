<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  let { data } = $props()
</script>

  <div class="sc-page">
    <div class="sc-page-title">{data.role.name}</div>
    <div class="sc-page-subtitle">
      <RichText html={data.role.descriptionHtml} />
    </div>

  <div class="sc-section">
    <div class="sc-section-title">Role Details</div>
    <div class="sc-card">
      <div class="sc-byline">
        <RolePortal role={data.role} size="lg" />
        <span class="sc-pill">{data.role.personName}</span>
        <span class="sc-pill">{data.role.hoursPerWeek} hrs/week</span>
        {#if data.reportsTo}
          <span>·</span>
          <span>Reports to</span>
          <RolePortal role={data.reportsTo} size="sm" />
        {/if}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Do They Run?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.ownedProcesses as process}
          <ProcessPortal process={process} />
        {/each}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Do They Do?</div>
    {#each data.actionsByProcess as entry}
      <div class="sc-card">
        <div class="sc-meta">
          <ProcessPortal process={entry.process} />
        </div>
        {#if entry.actions.length === 0}
          <div style="margin-top:8px; color: var(--sc-text-muted);">
            No direct actions recorded yet.
          </div>
        {:else}
          {#each entry.actions as action}
            <div style="margin-top:10px;">
              <div style="font-weight: 600;">Action {action.sequence}</div>
              <RichText html={action.descriptionHtml} />
              <div class="sc-byline" style="margin-top:6px;">
                <RolePortal role={data.role} size="sm" />
                <span>· in</span>
                <SystemPortal system={action.system} size="sm" />
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/each}
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Tools?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.systemsAccessed as system}
          <SystemPortal system={system} />
        {/each}
      </div>
    </div>
  </div>

  {#if data.roleFlags.length}
    <div class="sc-section">
      <div class="sc-section-title">What's Broken?</div>
      {#each data.roleFlags as flag}
        <div class="sc-card sc-card-flag">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          <div style="margin-top:10px;">{flag.message}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>
