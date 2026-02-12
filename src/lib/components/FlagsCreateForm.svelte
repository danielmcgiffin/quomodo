<script lang="ts">
  let {
    targetOptions,
    createFlagError,
  }: {
    targetOptions: { value: string; label: string }[]
    createFlagError?: string
  } = $props()
</script>

<div class="sc-section">
  <div class="sc-section-title">Create Flag</div>
  <form class="sc-card" method="POST" action="?/createFlag">
    {#if createFlagError}
      <div class="sc-form-error-block">
        {createFlagError}
      </div>
    {/if}
    <div class="sc-byline sc-byline-spaced">
      <select class="sc-search" name="target" required>
        <option value="">Target entity</option>
        {#each targetOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      <select class="sc-search" name="flag_type">
        <option value="comment">comment</option>
        <option value="question">question</option>
        <option value="needs_review">needs_review</option>
        <option value="stale">stale</option>
        <option value="incorrect">incorrect</option>
      </select>
    </div>
    <div class="sc-byline sc-byline-spaced">
      <input
        class="sc-search"
        name="target_path"
        placeholder="Target path (optional)"
      />
    </div>
    <div class="sc-byline sc-byline-spaced">
      <textarea
        class="sc-search"
        name="message"
        placeholder="Flag message"
        rows="3"
        required
      ></textarea>
    </div>
    <button class="sc-btn" type="submit">Create Flag</button>
  </form>
</div>
