<script lang="ts">
  import RichText from "$lib/components/RichText.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import CopyLinkButton from "$lib/components/CopyLinkButton.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"
  import { pendingEnhance } from "$lib/components/pending-enhance"

  type SidebarRole = {
    id: string
    slug: string
    name: string
    initials: string
  }

  type ProcessData = {
    id: string
    slug: string
    name: string
    descriptionRich: string
    descriptionHtml: string
    trigger: string
    endState: string
    ownerRole?: SidebarRole | null
  }

  type ProcessForm = {
    updateProcessError?: string
    deleteProcessError?: string
    processNameDraft?: string
    processDescriptionDraft?: string
    processDescriptionRichDraft?: string
    processTriggerDraft?: string
    processEndStateDraft?: string
    selectedProcessOwnerRoleIdDraft?: string
  }

  type Props = {
    process: ProcessData
    allRoles: SidebarRole[]
    canEdit: boolean
    viewerRole: "owner" | "admin" | "editor" | "member"
    createFlagError?: string
    createFlagTargetType?: string
    createFlagTargetId?: string
    createFlagTargetPath?: string
    form?: ProcessForm
  }

  let {
    process,
    allRoles,
    canEdit,
    viewerRole,
    createFlagError,
    createFlagTargetType,
    createFlagTargetId,
    createFlagTargetPath,
    form,
  }: Props = $props()

  const processFieldTargets = [
    { path: "name", label: "Name" },
    { path: "description", label: "Description" },
    { path: "trigger", label: "Trigger" },
    { path: "end_state", label: "End state" },
    { path: "owner_role_id", label: "Owner role" },
  ]

  const htmlToDraftText = (html: string): string =>
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  let isEditProcessModalOpen = $state(false)
  let processNameDraft = $state("")
  let processDescriptionDraft = $state("")
  let processDescriptionRichDraft = $state("")
  let processTriggerDraft = $state("")
  let processEndStateDraft = $state("")
  let selectedProcessOwnerRoleId = $state("")

  const setProcessDraftsFromData = () => {
    processNameDraft = process.name
    processDescriptionDraft = htmlToDraftText(process.descriptionHtml)
    processDescriptionRichDraft = process.descriptionRich
    processTriggerDraft = process.trigger ?? ""
    processEndStateDraft = process.endState ?? ""
    selectedProcessOwnerRoleId = process.ownerRole?.id ?? ""
  }

  const openEditProcessModal = () => {
    setProcessDraftsFromData()
    isEditProcessModalOpen = true
  }

  const confirmDeleteProcess = (event: SubmitEvent) => {
    const shouldDelete = confirm("Delete this process and all of its actions?")
    if (!shouldDelete) {
      event.preventDefault()
    }
  }

  $effect(() => {
    if (form?.updateProcessError) {
      isEditProcessModalOpen = true
    }
    processNameDraft =
      typeof form?.processNameDraft === "string"
        ? form.processNameDraft
        : process.name
    processDescriptionDraft =
      typeof form?.processDescriptionDraft === "string"
        ? form.processDescriptionDraft
        : htmlToDraftText(process.descriptionHtml)
    processDescriptionRichDraft =
      typeof form?.processDescriptionRichDraft === "string"
        ? form.processDescriptionRichDraft
        : process.descriptionRich
    processTriggerDraft =
      typeof form?.processTriggerDraft === "string"
        ? form.processTriggerDraft
        : process.trigger
    processEndStateDraft =
      typeof form?.processEndStateDraft === "string"
        ? form.processEndStateDraft
        : process.endState
    selectedProcessOwnerRoleId =
      typeof form?.selectedProcessOwnerRoleIdDraft === "string"
        ? form.selectedProcessOwnerRoleIdDraft
        : (process.ownerRole?.id ?? "")
  })
</script>

<div class="flex justify-between items-start gap-4 flex-wrap">
  <div class="flex flex-col">
    <div class="sc-process-title-row">
      <div class="sc-page-title">{process.name}</div>
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
  </div>
  <div class="sc-actions">
    {#if canEdit}
      <button
        class="sc-btn secondary"
        type="button"
        onclick={openEditProcessModal}
      >
        Edit Process
      </button>
      <form
        method="POST"
        action="?/deleteProcess"
        onsubmit={confirmDeleteProcess}
        use:pendingEnhance
      >
        <input type="hidden" name="process_id" value={process.id} />
        <button class="sc-btn secondary" type="submit" data-loading-label="Deleting...">
          Delete Process
        </button>
      </form>
    {/if}
  </div>
</div>

{#if form?.deleteProcessError}
  <div class="sc-form-error sc-stack-top-10">
    {form.deleteProcessError}
  </div>
{/if}

<ScModal
  bind:open={isEditProcessModalOpen}
  title="Edit Process"
  description="Update the trigger, outcome, and owner role."
  maxWidth="860px"
>
  <form
    class="sc-form"
    method="POST"
    action="?/updateProcess"
    use:pendingEnhance
  >
    {#if form?.updateProcessError}
      <div class="sc-form-error">{form.updateProcessError}</div>
    {/if}
    <input type="hidden" name="process_id" value={process.id} />

    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="name"
        placeholder="Process name"
        bind:value={processNameDraft}
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
        placeholder="Trigger - What starts the process?"
        bind:value={processTriggerDraft}
        rows="3"
      ></textarea>
      <textarea
        class="sc-search sc-field sc-textarea"
        name="end_state"
        placeholder="Outcome - What should be different at the end of the process?"
        bind:value={processEndStateDraft}
        rows="3"
      ></textarea>
    </div>

    <div class="sc-form-actions">
      <select
        class="sc-search sc-field"
        name="owner_role_id"
        bind:value={selectedProcessOwnerRoleId}
      >
        <option value="">Owner role (optional)</option>
        {#each allRoles as role}
          <option value={role.id}>{role.name}</option>
        {/each}
      </select>
      <button class="sc-btn" type="submit" data-loading-label="Saving...">
        Save Process
      </button>
    </div>
  </form>
</ScModal>

<style>
  .sc-process-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .sc-process-title-row .sc-page-title {
    margin-bottom: 0;
  }
</style>
