<script lang="ts">
  import ScModal from "$lib/components/ScModal.svelte"

  type Role = { id: string; name: string }
  type System = { id: string; name: string }

  let {
    open = $bindable(false),
    editingActionId = $bindable<string | null>(null),
    actionDescriptionDraft = $bindable(""),
    selectedOwnerRoleId = $bindable(""),
    selectedSystemId = $bindable(""),
    allRoles,
    allSystems,
    createdRoleId,
    createdSystemId,
    createActionError,
    onOpenRoleModal,
    onOpenSystemModal,
  }: {
    open?: boolean
    editingActionId?: string | null
    actionDescriptionDraft?: string
    selectedOwnerRoleId?: string
    selectedSystemId?: string
    allRoles: Role[]
    allSystems: System[]
    createdRoleId?: string
    createdSystemId?: string
    createActionError?: string
    onOpenRoleModal: () => void
    onOpenSystemModal: () => void
  } = $props()
</script>

<ScModal
  bind:open
  title={editingActionId ? "Edit Action" : "Add Action"}
  description={editingActionId
    ? "Update this action's description, role, and system."
    : "Capture one action in this process and link role + system."}
  maxWidth="760px"
>
  <form
    class="sc-form sc-action-modal-form"
    method="POST"
    action="?/createAction"
  >
    {#if createActionError}
      <div class="sc-form-error">{createActionError}</div>
    {/if}
    {#if editingActionId}
      <input type="hidden" name="action_id" value={editingActionId} />
    {/if}
    <div class="sc-form-row sc-action-modal-description-row">
      <textarea
        class="sc-search sc-field sc-textarea sc-action-modal-description"
        name="description"
        bind:value={actionDescriptionDraft}
        placeholder="Action description"
        rows="4"
        required
      ></textarea>
    </div>
    <div class="sc-form-row sc-action-modal-controls-row">
      <select
        class="sc-search sc-field sc-action-modal-select"
        name="owner_role_id"
        bind:value={selectedOwnerRoleId}
        required
      >
        <option value="">Role responsible</option>
        {#each allRoles as role}
          <option value={role.id} selected={createdRoleId === role.id}
            >{role.name}</option
          >
        {/each}
      </select>
      <button
        class="sc-btn secondary sc-action-modal-btn"
        type="button"
        onclick={onOpenRoleModal}
      >
        Create Role
      </button>
      <select
        class="sc-search sc-field sc-action-modal-select"
        name="system_id"
        bind:value={selectedSystemId}
        required
      >
        <option value="">System</option>
        {#each allSystems as system}
          <option value={system.id} selected={createdSystemId === system.id}
            >{system.name}</option
          >
        {/each}
      </select>
      <button
        class="sc-btn secondary sc-action-modal-btn"
        type="button"
        onclick={onOpenSystemModal}
      >
        Create System
      </button>
    </div>
    <div class="sc-form-row sc-action-modal-submit-row">
      <button class="sc-btn" type="submit">
        {editingActionId ? "Save Action" : "Create Action"}
      </button>
    </div>
  </form>
</ScModal>
