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

  let resolvingFlagId = $state<string | null>(null)
  let resolutionNoteDraft = $state("")

  const startResolveDraft = (flagId: string) => {
    resolvingFlagId = flagId
    resolutionNoteDraft = ""
  }

  const cancelResolveDraft = () => {
    resolvingFlagId = null
    resolutionNoteDraft = ""
  }

  const isOpenFlag = (flag: FlagsDashboardEntry) => flag.status === "open"

  const statusLabelByType: Record<string, string> = {
    open: "Open",
    resolved: "Resolved",
    dismissed: "Dismissed",
  }
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
            {#if canModerate && isOpenFlag(flag)}
              {#if resolvingFlagId !== flag.id}
                <button
                  class="sc-icon-btn"
                  type="button"
                  title="Resolve"
                  onclick={() => startResolveDraft(flag.id)}
                >
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
              {/if}
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
            {/if}
          </div>
        </div>

        <div class="sc-postit-body">
          <a class="sc-postit-message sc-flag-origin-link" href={flag.originHref}>
            {flag.message}
          </a>

          {#if canModerate && isOpenFlag(flag) && resolvingFlagId === flag.id}
            <form
              class="sc-flag-resolve-form"
              method="POST"
              action="?/resolveFlag"
              use:pendingEnhance
              onsubmit={cancelResolveDraft}
            >
              <input type="hidden" name="id" value={flag.id} />
              <label class="sc-flag-resolve-label" for={`resolution-note-${flag.id}`}>
                Resolution note (optional)
              </label>
              <textarea
                id={`resolution-note-${flag.id}`}
                class="sc-search sc-field sc-textarea sc-flag-resolve-textarea"
                name="resolution_note"
                bind:value={resolutionNoteDraft}
                rows="3"
                maxlength="280"
                placeholder="Add context for why this was resolved"
              ></textarea>
              <div class="sc-flag-resolve-actions">
                <button class="sc-btn" type="submit" data-loading-label="Resolving...">
                  Resolve
                </button>
                <button
                  class="sc-btn secondary"
                  type="button"
                  onclick={cancelResolveDraft}
                >
                  Cancel
                </button>
              </div>
            </form>
          {/if}
        </div>

        <div class="sc-postit-footer">
          <div class="sc-postit-meta">
            <span class="text-xs opacity-60">Raised {flag.createdAt}</span>
            <div class="sc-postit-target">
              {#if flag.targetType === "process" && flag.target}
                <ProcessPortal process={flag.target} size="sm" />
              {:else if flag.targetType === "system" && flag.target}
                <SystemPortal system={flag.target} size="sm" />
              {:else if flag.targetType === "role" && flag.target}
                <RolePortal role={flag.target} size="sm" />
              {:else if flag.targetType === "action" && flag.target}
                <a class="sc-portal sc-portal-process" href={flag.target.href}>
                  <span class="sc-portal-name">{flag.target.label}</span>
                </a>
              {/if}
            </div>
          </div>

          {#if flag.targetPath}
            <div class="sc-flag-target-path">Path: {flag.targetPath}</div>
          {/if}

          {#if !isOpenFlag(flag)}
            <div class="sc-flag-resolution-line">
              <span class="sc-pill">
                {statusLabelByType[flag.status] ?? flag.status}
              </span>
              {#if flag.resolvedAt}
                <span>{flag.resolvedAt}</span>
              {/if}
              {#if flag.resolvedByLabel}
                <span>by {flag.resolvedByLabel}</span>
              {/if}
            </div>
            {#if flag.resolutionNote}
              <div class="sc-flag-resolution-note">“{flag.resolutionNote}”</div>
            {/if}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .sc-flag-origin-link {
    color: inherit;
    text-decoration: none;
  }

  .sc-flag-origin-link:hover,
  .sc-flag-origin-link:focus-visible {
    color: var(--sc-green);
    text-decoration: underline;
  }

  .sc-flag-resolve-form {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sc-flag-resolve-label {
    font-size: var(--sc-font-xs, 0.75rem);
    color: var(--sc-text-muted);
    font-weight: 600;
  }

  .sc-flag-resolve-textarea {
    min-height: 74px;
  }

  .sc-flag-resolve-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .sc-flag-target-path {
    color: var(--sc-text-light);
    font-size: var(--sc-font-xs, 0.75rem);
    margin-top: 6px;
  }

  .sc-flag-resolution-line {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-size: var(--sc-font-xs, 0.75rem);
    color: var(--sc-text-muted);
  }

  .sc-flag-resolution-note {
    margin-top: 6px;
    font-size: var(--sc-font-sm, 0.875rem);
    color: var(--sc-text-muted);
  }
</style>
