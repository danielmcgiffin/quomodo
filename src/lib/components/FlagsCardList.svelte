<script lang="ts">
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import CopyLinkButton from "$lib/components/CopyLinkButton.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"
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
  <div class="sc-flag-grid">
    {#each flags as flag}
      <div class="sc-card sc-card-flag sc-postit-card" id={`flag-${flag.id}`}>
        <div class="sc-postit-header">
          <div class="sc-flag-banner">
            <span aria-hidden="true">⚑</span>
            {flag.flagType.replace("_", " ")}
          </div>
          <div class="sc-postit-actions">
            <CopyLinkButton
              variant="icon"
              href={`/app/flags#flag-${flag.id}`}
              label="Copy link to flag"
            />
            {#if canModerate}
              <form method="POST" action="?/resolveFlag" use:pendingEnhance>
                <input type="hidden" name="id" value={flag.id} />
                <button class="sc-icon-btn" type="submit" title="Resolve">
                  <svg
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </form>
              <form method="POST" action="?/dismissFlag" use:pendingEnhance>
                <input type="hidden" name="id" value={flag.id} />
                <button class="sc-icon-btn" type="submit" title="Dismiss">
                  <svg
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </form>
            {/if}
          </div>
        </div>

        <div class="sc-postit-body">
          <div class="sc-postit-message">
            {flag.message}
          </div>
        </div>

        <div class="sc-postit-footer">
          <div class="sc-postit-meta">
            <span class="text-xs opacity-60">{flag.createdAt}</span>
            <div class="sc-postit-target">
              {#if flag.targetType === "process" && flag.target}
                <ProcessPortal process={flag.target} size="sm" />
              {:else if flag.targetType === "system" && flag.target}
                <SystemPortal system={flag.target} size="sm" />
              {:else if flag.targetType === "role" && flag.target}
                <RolePortal role={flag.target} size="sm" />
              {:else if flag.targetType === "action" && flag.target}
                <span class="text-xs font-semibold truncate"
                  >{flag.target.label}</span
                >
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
