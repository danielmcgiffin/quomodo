<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import {
    buildFlagsHref,
    type DirectFlagBadgeData,
    type FlagBadgeFlag,
    type FlagViewerRole,
    type RelatedFlagBadgeData,
  } from "$lib/flags"
  import ScModal from "$lib/components/ScModal.svelte"

  type Props = {
    kind: "direct" | "related"
    viewerRole: FlagViewerRole
    label: string
    data: DirectFlagBadgeData | RelatedFlagBadgeData
    modalTitle?: string
    modalDescription?: string
    className?: string
    directOriginHref?: string
  }

  let {
    kind,
    viewerRole,
    label,
    data,
    modalTitle,
    modalDescription = "",
    className = "",
    directOriginHref,
  }: Props = $props()

  let isOpen = $state(false)
  let pendingFlagId = $state<string | null>(null)
  let submitError = $state("")
  let resolveFlagId = $state<string | null>(null)
  let resolutionNoteDraft = $state("")

  const canModerate = $derived(viewerRole !== "member")
  const count = $derived(kind === "direct" ? data.count : data.count)
  const icon = $derived(kind === "direct" ? "⚑" : "⚐")
  const badgeClass = $derived(
    `sc-flag-indicator ${kind === "related" ? "sc-flag-indicator--related" : ""} ${className}`.trim(),
  )
  const resolvedTitle = $derived(
    modalTitle ?? `${label} ${kind === "direct" ? "flags" : "related flags"}`,
  )

  $effect(() => {
    if (!isOpen) {
      resolveFlagId = null
      resolutionNoteDraft = ""
      submitError = ""
    }
  })

  const startResolve = (flagId: string) => {
    resolveFlagId = flagId
    resolutionNoteDraft = ""
    submitError = ""
  }

  const cancelResolve = () => {
    resolveFlagId = null
    resolutionNoteDraft = ""
  }

  const updateFlagStatus = async (
    flagId: string,
    action: "resolve" | "dismiss",
    resolutionNote = "",
  ) => {
    submitError = ""
    pendingFlagId = flagId

    const response = await fetch("/app/flags/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: flagId,
        action,
        resolutionNote,
      }),
    })

    pendingFlagId = null

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      submitError = payload?.error ?? "Unable to update flag."
      return false
    }

    await invalidateAll()

    if (action === "resolve") {
      cancelResolve()
    }

    return true
  }

  const submitResolve = async (flagId: string) => {
    await updateFlagStatus(flagId, "resolve", resolutionNoteDraft)
  }

  const getDirectOriginHref = (flag: FlagBadgeFlag) =>
    directOriginHref ||
    buildFlagsHref({
      targetType: flag.targetType,
      targetId: flag.targetId,
    })
</script>

{#if count > 0}
  <button class={badgeClass} type="button" onclick={() => (isOpen = true)}>
    <span aria-hidden="true">{icon}</span>
    <span>{count}</span>
    <span class="sr-only">{label}</span>
  </button>

  <ScModal
    bind:open={isOpen}
    title={resolvedTitle}
    description={modalDescription}
    maxWidth="760px"
  >
    <div class="sc-flag-modal">
      {#if submitError}
        <div class="sc-form-error">{submitError}</div>
      {/if}

      {#if kind === "direct"}
        {@const directData = data as DirectFlagBadgeData}
        <div class="sc-flag-modal-list">
          {#each directData.flags as flag (flag.id)}
            <article class="sc-card sc-card-flag sc-flag-modal-card">
              <div class="sc-flag-modal-card-head">
                <div class="sc-flag-banner">
                  <span aria-hidden="true">⚑</span>
                  {flag.flagType.replaceAll("_", " ")}
                </div>
                {#if canModerate}
                  <div class="sc-flag-modal-actions">
                    {#if resolveFlagId !== flag.id}
                      <button
                        class="sc-icon-btn"
                        type="button"
                        disabled={pendingFlagId === flag.id}
                        onclick={() => startResolve(flag.id)}
                      >
                        Resolve
                      </button>
                    {/if}
                    <button
                      class="sc-icon-btn"
                      type="button"
                      disabled={pendingFlagId === flag.id}
                      onclick={() => updateFlagStatus(flag.id, "dismiss")}
                    >
                      Dismiss
                    </button>
                  </div>
                {/if}
              </div>

              <a class="sc-flag-modal-link" href={getDirectOriginHref(flag)}>
                {flag.message}
              </a>

              {#if canModerate && resolveFlagId === flag.id}
                <form
                  class="sc-flag-resolve-form"
                  onsubmit={(event) => {
                    event.preventDefault()
                    void submitResolve(flag.id)
                  }}
                >
                  <label class="sc-flag-resolve-label" for={`flag-resolve-${flag.id}`}>
                    Resolution note (optional)
                  </label>
                  <textarea
                    id={`flag-resolve-${flag.id}`}
                    class="sc-search sc-field sc-textarea sc-flag-resolve-textarea"
                    bind:value={resolutionNoteDraft}
                    rows="3"
                    maxlength="280"
                    placeholder="Add context for why this was resolved"
                  ></textarea>
                  <div class="sc-flag-resolve-actions">
                    <button
                      class="sc-btn"
                      type="submit"
                      disabled={pendingFlagId === flag.id}
                    >
                      Resolve
                    </button>
                    <button
                      class="sc-btn secondary"
                      type="button"
                      disabled={pendingFlagId === flag.id}
                      onclick={cancelResolve}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              {/if}

              <div class="sc-flag-modal-meta">{flag.createdAt}</div>
            </article>
          {/each}
        </div>
      {:else}
        {@const relatedData = data as RelatedFlagBadgeData}
        <div class="sc-flag-modal-groups">
          {#each relatedData.groups as group (group.key)}
            <section class="sc-flag-modal-group">
              <div class="sc-flag-modal-group-head">
                <a class="sc-section-title sc-flag-modal-group-link" href={group.href}>
                  {group.label}
                </a>
                <span class="sc-pill">{group.flags.length} open</span>
              </div>

              <div class="sc-flag-modal-list">
                {#each group.flags as flag (flag.id)}
                  <article class="sc-card sc-card-flag sc-flag-modal-card">
                    <div class="sc-flag-modal-card-head">
                      <div class="sc-flag-banner">
                        <span aria-hidden="true">⚑</span>
                        {flag.flagType.replaceAll("_", " ")}
                      </div>
                      {#if canModerate}
                        <div class="sc-flag-modal-actions">
                          {#if resolveFlagId !== flag.id}
                            <button
                              class="sc-icon-btn"
                              type="button"
                              disabled={pendingFlagId === flag.id}
                              onclick={() => startResolve(flag.id)}
                            >
                              Resolve
                            </button>
                          {/if}
                          <button
                            class="sc-icon-btn"
                            type="button"
                            disabled={pendingFlagId === flag.id}
                            onclick={() => updateFlagStatus(flag.id, "dismiss")}
                          >
                            Dismiss
                          </button>
                        </div>
                      {/if}
                    </div>

                    <a class="sc-flag-modal-link" href={group.href}>
                      {flag.message}
                    </a>

                    {#if canModerate && resolveFlagId === flag.id}
                      <form
                        class="sc-flag-resolve-form"
                        onsubmit={(event) => {
                          event.preventDefault()
                          void submitResolve(flag.id)
                        }}
                      >
                        <label
                          class="sc-flag-resolve-label"
                          for={`flag-resolve-related-${flag.id}`}
                        >
                          Resolution note (optional)
                        </label>
                        <textarea
                          id={`flag-resolve-related-${flag.id}`}
                          class="sc-search sc-field sc-textarea sc-flag-resolve-textarea"
                          bind:value={resolutionNoteDraft}
                          rows="3"
                          maxlength="280"
                          placeholder="Add context for why this was resolved"
                        ></textarea>
                        <div class="sc-flag-resolve-actions">
                          <button
                            class="sc-btn"
                            type="submit"
                            disabled={pendingFlagId === flag.id}
                          >
                            Resolve
                          </button>
                          <button
                            class="sc-btn secondary"
                            type="button"
                            disabled={pendingFlagId === flag.id}
                            onclick={cancelResolve}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    {/if}

                    <div class="sc-flag-modal-meta">{flag.createdAt}</div>
                  </article>
                {/each}
              </div>
            </section>
          {/each}
        </div>
      {/if}
    </div>
  </ScModal>
{/if}

<style>
  .sc-flag-indicator {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: var(--sc-radius-full);
    border: 1px solid var(--sc-flag-border);
    background: color-mix(in srgb, var(--sc-flag) 88%, var(--sc-white) 12%);
    color: var(--sc-flag-text);
    font-size: var(--sc-font-xs, 0.75rem);
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }

  button.sc-flag-indicator {
    appearance: none;
  }

  .sc-flag-indicator--related {
    background: transparent;
    color: var(--sc-flag-text);
    border-style: dashed;
  }

  .sc-flag-modal {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sc-flag-modal-groups,
  .sc-flag-modal-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sc-flag-modal-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sc-flag-modal-group-head,
  .sc-flag-modal-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .sc-flag-modal-group-link,
  .sc-flag-modal-link {
    color: inherit;
    text-decoration: none;
  }

  .sc-flag-modal-group-link:hover,
  .sc-flag-modal-group-link:focus-visible,
  .sc-flag-modal-link:hover,
  .sc-flag-modal-link:focus-visible {
    color: var(--sc-green);
  }

  .sc-flag-modal-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sc-flag-modal-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .sc-flag-resolve-form {
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

  .sc-flag-modal-message,
  .sc-flag-modal-link {
    font-size: var(--sc-font-sm, 0.9375rem);
    line-height: 1.5;
  }

  .sc-flag-modal-meta {
    color: var(--sc-text-muted);
    font-size: var(--sc-font-xs, 0.75rem);
  }
</style>
