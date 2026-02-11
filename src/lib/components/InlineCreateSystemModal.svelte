<script lang="ts">
  import ScModal from "$lib/components/ScModal.svelte"

  type RoleOption = {
    id: string
    name: string
  }

  let {
    open = $bindable(false),
    action = "?/createSystem",
    roles = [],
    selectedRoleId = "",
    errorMessage = "",
    title = "Add System",
    description = "Create a system.",
    helperText = "This system is immediately available.",
    maxWidth = "760px",
  }: {
    open?: boolean
    action?: string
    roles?: RoleOption[]
    selectedRoleId?: string
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
      <input class="sc-search sc-field" name="name" placeholder="System name" required />
      <input
        class="sc-search sc-field"
        name="location"
        placeholder="Location (URL or app section)"
      />
    </div>
    <div class="sc-form-row">
      <input class="sc-search sc-field" name="url" placeholder="Public URL" />
      <select class="sc-search sc-field" name="owner_role_id">
        <option value="">Owner role (optional)</option>
        {#each roles as role}
          <option value={role.id} selected={selectedRoleId === role.id}
            >{role.name}</option
          >
        {/each}
      </select>
    </div>
    <div class="sc-form-row">
      <textarea
        class="sc-search sc-field sc-textarea"
        name="description"
        placeholder="System description - what this system is used for"
        rows="4"
      ></textarea>
    </div>
    <div class="sc-form-actions">
      <div class="sc-page-subtitle">{helperText}</div>
      <button class="sc-btn" type="submit">Create System</button>
    </div>
  </form>
</ScModal>
