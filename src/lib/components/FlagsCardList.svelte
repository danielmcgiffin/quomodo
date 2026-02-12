<script lang="ts">
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import type { FlagsDashboardEntry } from "$lib/server/app/mappers/flags"

  let {
    flags,
    canModerate,
  }: {
    flags: FlagsDashboardEntry[]
    canModerate: boolean
  } = $props()
</script>

<div class="sc-section">
  {#each flags as flag}
    <div class="sc-card sc-card-flag">
      <div class="sc-byline">
        <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
        <span class="sc-pill">Flagged {flag.createdAt}</span>
        <span class="sc-pill">Status: {flag.status}</span>
      </div>
      <div class="sc-copy-md">
        {flag.message}
      </div>
      <div class="sc-byline sc-byline-stack">
        <span>Target</span>
        {#if flag.targetType === "process" && flag.target}
          <ProcessPortal process={flag.target} />
        {:else if flag.targetType === "system" && flag.target}
          <SystemPortal system={flag.target} />
        {:else if flag.targetType === "role" && flag.target}
          <RolePortal role={flag.target} />
        {:else if flag.targetType === "action" && flag.target}
          <span>{flag.target.label}</span>
        {/if}
        {#if flag.targetPath}
          <span>·</span>
          <span>Path: {flag.targetPath}</span>
        {/if}
      </div>
      {#if canModerate}
        <div class="sc-actions sc-actions-stack">
          <form method="POST" action="?/resolveFlag">
            <input type="hidden" name="id" value={flag.id} />
            <button class="sc-btn" type="submit">Resolve</button>
          </form>
          <form method="POST" action="?/dismissFlag">
            <input type="hidden" name="id" value={flag.id} />
            <button class="sc-btn secondary" type="submit">Dismiss</button>
          </form>
        </div>
      {/if}
    </div>
  {/each}
</div>
