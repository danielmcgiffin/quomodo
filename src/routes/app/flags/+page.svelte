<script lang="ts">
  import { flags, processById, roleById, systemById } from "$lib/data/atlas"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
</script>

<div class="sc-page">
  <div class="sc-page-title">Flags</div>
  <div class="sc-page-subtitle">
    Maintenance dashboard for rot across the atlas.
  </div>

  <div class="sc-section">
    {#each flags as flag}
      <div class="sc-card sc-card-flag">
        <div class="sc-byline">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          <span class="sc-pill">Flagged {flag.createdAt}</span>
        </div>
        <div style="margin-top:12px; font-size: var(--sc-font-md);">
          {flag.message}
        </div>
        <div class="sc-byline" style="margin-top:12px;">
          <span>Target</span>
          {#if flag.targetType === "process"}
            <ProcessPortal process={processById.get(flag.targetId)!} />
          {:else if flag.targetType === "system"}
            <SystemPortal system={systemById.get(flag.targetId)!} />
          {:else if flag.targetType === "role"}
            <RolePortal role={roleById.get(flag.targetId)!} />
          {/if}
          {#if flag.processId}
            <span>·</span>
            <ProcessPortal process={processById.get(flag.processId)!} />
          {/if}
          {#if flag.ownerRoleId}
            <span>·</span>
            <RolePortal role={roleById.get(flag.ownerRoleId)!} />
          {/if}
        </div>
        <div class="sc-actions" style="margin-top:12px;">
          <button class="sc-btn">Resolve</button>
          <button class="sc-btn secondary">Dismiss</button>
        </div>
      </div>
    {/each}
  </div>
</div>
