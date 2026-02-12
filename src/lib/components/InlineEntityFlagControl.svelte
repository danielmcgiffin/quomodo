<script lang="ts">
  import ScModal from "$lib/components/ScModal.svelte"

  type EntityType = "process" | "role" | "system" | "action"
  type MembershipRole = "owner" | "admin" | "editor" | "member"

  let {
    action = "?/createFlag",
    targetType,
    targetId,
    entityLabel = "entity",
    viewerRole = "member",
    errorMessage = "",
    errorTargetType = "",
    errorTargetId = "",
  }: {
    action?: string
    targetType: EntityType
    targetId: string
    entityLabel?: string
    viewerRole?: MembershipRole
    errorMessage?: string
    errorTargetType?: string
    errorTargetId?: string
  } = $props()

  let open = $state(false)

  const showError = $derived(
    Boolean(errorMessage) &&
      errorTargetType === targetType &&
      errorTargetId === targetId,
  )

  $effect(() => {
    if (showError) {
      open = true
    }
  })
</script>

<button
  class="sc-flag-hover-btn"
  type="button"
  title={`Flag ${entityLabel}`}
  aria-label={`Flag ${entityLabel}`}
  onclick={() => {
    open = true
  }}
>
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M4 2.5c0-.28.22-.5.5-.5s.5.22.5.5V3h6.5c.24 0 .43.17.49.4.06.23-.03.47-.22.6l-1.88 1.32 1.87 1.31c.19.13.28.37.22.6a.5.5 0 0 1-.48.37H5v5.9a.5.5 0 0 1-1 0v-11Z"
      fill="currentColor"
    />
  </svg>
</button>

<ScModal
  bind:open
  title={`Flag ${entityLabel}`}
  description="Report stale, incorrect, or questionable details."
  maxWidth="680px"
>
  <form class="sc-form" method="POST" {action}>
    {#if showError}
      <div class="sc-form-error">{errorMessage}</div>
    {/if}
    <input type="hidden" name="target_type" value={targetType} />
    <input type="hidden" name="target_id" value={targetId} />
    <div class="sc-form-row">
      <select class="sc-search sc-field" name="flag_type">
        <option value="comment">comment</option>
        {#if viewerRole !== "member"}
          <option value="question">question</option>
          <option value="needs_review">needs_review</option>
          <option value="stale">stale</option>
          <option value="incorrect">incorrect</option>
        {/if}
      </select>
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
        Members can create `comment` flags. Elevated roles can create all types.
      </div>
      <button class="sc-btn" type="submit">Create Flag</button>
    </div>
  </form>
</ScModal>
