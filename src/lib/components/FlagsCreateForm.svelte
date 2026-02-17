<script lang="ts">
  import ScModal from "$lib/components/ScModal.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"

  let {
    targetOptions,
    createFlagError,
  }: {
    targetOptions: { value: string; label: string }[]
    createFlagError?: string
  } = $props()

  let open = $state(false)

  $effect(() => {
    if (createFlagError) {
      open = true
    }
  })
</script>

<button
  class="sc-btn secondary"
  type="button"
  onclick={() => {
    open = true
  }}
>
  Create Flag
</button>

<ScModal
  bind:open
  title="Create Flag"
  description="Report stale, incorrect, or questionable details."
  maxWidth="760px"
>
  <form class="sc-form" method="POST" action="?/createFlag" use:pendingEnhance>
    {#if createFlagError}
      <div class="sc-form-error">{createFlagError}</div>
    {/if}
    <div class="sc-form-row">
      <select class="sc-search sc-field" name="target" required>
        <option value="">Target entity</option>
        {#each targetOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      <select class="sc-search sc-field" name="flag_type">
        <option value="comment">comment</option>
        <option value="question">question</option>
        <option value="needs_review">needs_review</option>
        <option value="stale">stale</option>
        <option value="incorrect">incorrect</option>
      </select>
    </div>
    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="target_path"
        placeholder="Target path (optional)"
      />
    </div>
    <div class="sc-form-row">
      <textarea
        class="sc-search sc-field sc-textarea"
        name="message"
        placeholder="What should be fixed?"
        rows="4"
        required
      ></textarea>
    </div>
    <div class="sc-form-actions">
      <div class="sc-page-subtitle">
        Use flags to track maintenance work across roles, systems, processes,
        and actions.
      </div>
      <button class="sc-btn" type="submit" data-loading-label="Creating...">
        Create Flag
      </button>
    </div>
  </form>
</ScModal>
