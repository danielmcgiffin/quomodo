<script lang="ts">
  import ScModal from "$lib/components/ScModal.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"

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
    actionTitleDraft = "",
    actionDescriptionDraft = "",
    actionDescriptionRichDraft = "",
    selectedOwnerRoleId = "",
    selectedSystemId = "",
    editingActionId = "",
    actionSequenceDraft = "",
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
    actionTitleDraft?: string
    actionDescriptionDraft?: string
    actionDescriptionRichDraft?: string
    selectedOwnerRoleId?: string
    selectedSystemId?: string
    editingActionId?: string
    actionSequenceDraft?: string
    maxWidth?: string
  } = $props()

  let systemDescriptionDraft = $state("")
  let systemDescriptionRichDraft = $state("")
</script>

<ScModal bind:open {title} {description} {maxWidth}>
  <form class="sc-form" method="POST" {action} use:pendingEnhance>
    <input type="hidden" name="action_title_draft" value={actionTitleDraft} />
    <input
      type="hidden"
      name="action_description_draft"
      value={actionDescriptionDraft}
    />
    <input
      type="hidden"
      name="action_description_rich_draft"
      value={actionDescriptionRichDraft}
    />
    <input
      type="hidden"
      name="selected_owner_role_id"
      value={selectedOwnerRoleId}
    />
    <input
      type="hidden"
      name="selected_system_id"
      value={selectedSystemId}
    />
    <input
      type="hidden"
      name="editing_action_id"
      value={editingActionId}
    />
    <input
      type="hidden"
      name="action_sequence_draft"
      value={actionSequenceDraft}
    />
    {#if errorMessage}
      <div class="sc-form-error">{errorMessage}</div>
    {/if}
    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="name"
        placeholder="System name"
        required
      />
    </div>
    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="location"
        placeholder="Location (URL or app section)"
      />
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
      <RichTextEditor
        fieldName="description_rich"
        textFieldName="description"
        bind:textValue={systemDescriptionDraft}
        bind:richValue={systemDescriptionRichDraft}
      />
    </div>
    <div class="sc-form-actions">
      <div class="sc-page-subtitle">{helperText}</div>
      <button class="sc-btn" type="submit" data-loading-label="Creating...">
        Create System
      </button>
    </div>
  </form>
</ScModal>
