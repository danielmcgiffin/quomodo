<script lang="ts">
  import ScModal from "$lib/components/ScModal.svelte"

  let {
    open = $bindable(false),
    action = "?/createRole",
    errorMessage = "",
    title = "Add Role",
    description = "Create a role.",
    helperText = "This role is immediately available.",
    maxWidth = "760px",
  }: {
    open?: boolean
    action?: string
    errorMessage?: string
    title?: string
    description?: string
    helperText?: string
    maxWidth?: string
  } = $props()
</script>

<ScModal bind:open={open} {title} {description} {maxWidth}>
  <form class="sc-form" method="POST" action={action}>
    {#if errorMessage}
      <div class="sc-form-error">{errorMessage}</div>
    {/if}
    <div class="sc-form-row">
      <input class="sc-search sc-field" name="name" placeholder="Role name" required />
    </div>
    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="person_name"
        placeholder="Person name (optional)"
      />
      <input
        class="sc-search sc-field"
        name="hours_per_week"
        placeholder="Hours per week (optional)"
      />
    </div>
    <div class="sc-form-row">
      <textarea
        class="sc-search sc-field sc-textarea"
        name="description"
        placeholder="Role description - what this role owns and why it exists"
        rows="4"
      ></textarea>
    </div>
    <div class="sc-form-actions">
      <div class="sc-page-subtitle">{helperText}</div>
      <button class="sc-btn" type="submit">Create Role</button>
    </div>
  </form>
</ScModal>
