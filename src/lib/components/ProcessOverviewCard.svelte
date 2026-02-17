<script lang="ts">
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import CopyLinkButton from "$lib/components/CopyLinkButton.svelte"
  import { Plus, Minus } from "lucide-svelte"

  let {
    process,
    viewerRole,
    createFlagError,
    createFlagTargetType,
    createFlagTargetId,
    createFlagTargetPath,
  }: {
    process: {
      id: string
      slug: string
      name: string
      descriptionHtml: string
      trigger: string
      endState: string
    }
    viewerRole: "owner" | "admin" | "editor" | "member"
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
  } = $props()

  let isOpen = $state(false)

  const processFieldTargets = [
    { path: "trigger", label: "Trigger" },
    { path: "description", label: "Description" },
    { path: "end_state", label: "End State" },
  ]

  function handleIconClick(e: MouseEvent) {
    e.stopPropagation()
  }
</script>

<div class="sc-section sc-entity-card">
  <div class="sc-process-overview-shell" class:is-open={isOpen}>
    <button
      class="sc-card sc-process-meta-card"
      class:is-open={isOpen}
      type="button"
      onclick={() => (isOpen = !isOpen)}
      aria-expanded={isOpen}
    >
      <div class="sc-process-meta-head">
        <div class="sc-process-meta-title-row">
          <span class="sc-process-meta-label">Process Details</span>
          {#if isOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="sc-process-meta-actions" onclick={handleIconClick}>
              <CopyLinkButton
                variant="icon"
                href={`/app/processes/${process.slug}`}
                label="Copy process link"
              />
              <InlineEntityFlagControl
                inline={true}
                action="?/createFlag"
                targetType="process"
                targetId={process.id}
                entityLabel={process.name}
                {viewerRole}
                fieldTargets={processFieldTargets}
                errorMessage={createFlagError}
                errorTargetType={createFlagTargetType}
                errorTargetId={createFlagTargetId}
                errorTargetPath={createFlagTargetPath}
              />
            </div>
          {/if}
        </div>
        <span class="sc-process-meta-icon">
          {#if isOpen}
            <Minus size={18} strokeWidth={2.5} />
          {:else}
            <Plus size={18} strokeWidth={2.5} />
          {/if}
        </span>
      </div>

      {#if isOpen}
        <div class="sc-process-meta-body">
          <div class="sc-process-overview-grid">
            <div class="sc-process-overview-left">
              <div class="sc-process-fact">
                <div class="sc-process-fact-label">Description</div>
                <div class="sc-process-fact-value sc-rich">
                  <!-- process.descriptionHtml is sanitized on the server via sanitize-html -->
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html process.descriptionHtml || "<p>Not set</p>"}
                </div>
              </div>
            </div>

            <div class="sc-process-overview-right">
              <div class="sc-process-fact">
                <div class="sc-process-fact-label">Trigger</div>
                <div class="sc-process-fact-value">
                  {process.trigger || "Not set"}
                </div>
              </div>

              <div class="sc-process-fact sc-stack-top-12">
                <div class="sc-process-fact-label">End State</div>
                <div class="sc-process-fact-value">
                  {process.endState || "Not set"}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </button>
  </div>
</div>

<style>
  .sc-process-overview-shell {
    position: relative;
    width: fit-content;
    max-width: 100%;
    transition: width 450ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sc-process-overview-shell.is-open {
    width: 100%;
  }

  .sc-process-meta-card {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    cursor: pointer;
    background: var(--sc-white);
    border: 1px solid var(--sc-border);
    transition:
      border-color 220ms ease,
      box-shadow 220ms ease,
      padding 450ms ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .sc-process-meta-card:not(.is-open):hover,
  .sc-process-meta-card:not(.is-open):focus-visible {
    border-color: #b42318;
    box-shadow: 0 0 0 1px rgba(180, 35, 24, 0.2);
  }

  .sc-process-meta-card.is-open {
    padding: 20px;
    cursor: default;
  }

  .sc-process-meta-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
  }

  .sc-process-meta-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sc-process-meta-label {
    font-weight: 700;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .sc-process-meta-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .sc-process-meta-icon {
    display: flex;
    align-items: center;
    color: var(--sc-text-light);
    transition: color 220ms ease;
  }

  .sc-process-meta-card:hover .sc-process-meta-icon {
    color: #b42318;
  }

  .sc-process-meta-card.is-open .sc-process-meta-icon {
    position: absolute;
    top: 20px;
    right: 20px;
    color: var(--sc-text-muted);
    cursor: pointer;
  }

  .sc-process-meta-card.is-open .sc-process-meta-icon:hover {
    color: #b42318;
  }

  .sc-process-meta-body {
    margin-top: 20px;
    width: 100%;
    animation: fadeIn 600ms ease forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .sc-process-overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
  }

  @media (max-width: 768px) {
    .sc-process-overview-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }

  button.sc-card {
    background: var(--sc-white);
    font-family: inherit;
    color: inherit;
  }
</style>
