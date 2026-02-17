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
  <div class="sc-flag-grid">
    {#each flags as flag}
      <div class="sc-card sc-card-flag sc-postit-card">
        <div class="sc-postit-header">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          {#if canModerate}
            <div class="sc-postit-actions">
              <form method="POST" action="?/resolveFlag">
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
              <form method="POST" action="?/dismissFlag">
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
              <form
                method="POST"
                action="?/deleteFlag"
                onsubmit={(e) => {
                  if (!confirm("Are you sure you want to delete this flag?")) {
                    e.preventDefault()
                  }
                }}
              >
                <input type="hidden" name="id" value={flag.id} />
                <button
                  class="sc-icon-btn hover:text-[var(--sc-red)]"
                  type="submit"
                  title="Delete"
                >
                  <svg
                    viewBox="0 0 20 20"
                    width="16"
                    height="16"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </form>
            </div>
          {/if}
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
