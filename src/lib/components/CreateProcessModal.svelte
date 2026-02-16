<script lang="ts">
  import ScModal from "$lib/components/ScModal.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"

  let {
    open = $bindable(false),
    roles,
    createProcessError,
    createRoleSuccess,
    createdRoleId,
    onOpenRoleModal,
  }: {
    open?: boolean
    roles: { id: string; name: string }[]
    createProcessError?: string
    createRoleSuccess?: boolean
    createdRoleId?: string
    onOpenRoleModal: () => void
  } = $props()

  let processDescriptionDraft = $state("")
  let processDescriptionRichDraft = $state("")
</script>

<ScModal
  bind:open
  title="Add Process"
  description="Capture key info about the process. All fields required."
  maxWidth="760px"
>
  <form class="sc-form" method="POST" action="?/createProcess">
    {#if createProcessError}
      <div class="sc-form-error">{createProcessError}</div>
    {/if}
    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="name"
        placeholder="Process name"
        required
      />
    </div>
    <div class="sc-form-row">
      <RichTextEditor
        fieldName="description_rich"
        textFieldName="description"
        bind:textValue={processDescriptionDraft}
        bind:richValue={processDescriptionRichDraft}
      />
    </div>
    <div class="sc-form-row">
      <textarea
        class="sc-search sc-field sc-textarea"
        name="trigger"
        placeholder="Trigger - What event or schedule kicks off the process?"
        rows="3"
      ></textarea>
      <textarea
        class="sc-search sc-field sc-textarea"
        name="end_state"
        placeholder="Outcome - What should be different at the end of the process?"
        rows="3"
      ></textarea>
    </div>
    <div class="sc-form-actions">
      <select class="sc-search sc-field" name="owner_role_id">
        <option value="">Owner role (optional)</option>
        {#each roles as role}
          <option value={role.id} selected={createdRoleId === role.id}
            >{role.name}</option
          >
        {/each}
      </select>
      <button class="sc-btn secondary" type="button" onclick={onOpenRoleModal}>
        Create Role
      </button>
      <button class="sc-btn" type="submit">Create Process</button>
    </div>
    {#if createRoleSuccess}
      <div class="sc-page-subtitle">
        Role created. Select it as owner and continue creating your process.
      </div>
    {/if}
  </form>
</ScModal>
