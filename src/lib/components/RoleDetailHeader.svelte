<script lang="ts">
  import RichText from "$lib/components/RichText.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"

  type RoleData = {
    id: string
    slug: string
    name: string
    initials: string
    descriptionRich: string
    descriptionHtml: string
  }

  type RoleForm = {
    updateRoleError?: string
    deleteRoleError?: string
    roleNameDraft?: string
    roleDescriptionDraft?: string
    roleDescriptionRichDraft?: string
  }

  type Props = {
    role: RoleData
    canEdit: boolean
    form?: RoleForm
  }

  let { role, canEdit, form }: Props = $props()

  const htmlToDraftText = (html: string): string =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim()

  let isEditRoleModalOpen = $state(false)
  let roleNameDraft = $state("")
  let roleDescriptionDraft = $state("")
  let roleDescriptionRichDraft = $state("")

  const setRoleDraftsFromData = () => {
    roleNameDraft = role.name
    roleDescriptionDraft = htmlToDraftText(role.descriptionHtml)
    roleDescriptionRichDraft = role.descriptionRich
  }

  const openEditRoleModal = () => {
    setRoleDraftsFromData()
    isEditRoleModalOpen = true
  }

  const confirmDeleteRole = (event: SubmitEvent) => {
    const shouldDelete = confirm(
      "Delete this role? Systems and processes will lose owner linkage, and actions assigned to this role must be reassigned first.",
    )
    if (!shouldDelete) {
      event.preventDefault()
    }
  }

  $effect(() => {
    if (form?.updateRoleError) {
      isEditRoleModalOpen = true
    }
    roleNameDraft =
      typeof form?.roleNameDraft === "string" ? form.roleNameDraft : role.name
    roleDescriptionDraft =
      typeof form?.roleDescriptionDraft === "string"
        ? form.roleDescriptionDraft
        : htmlToDraftText(role.descriptionHtml)
    roleDescriptionRichDraft =
      typeof form?.roleDescriptionRichDraft === "string"
        ? form.roleDescriptionRichDraft
        : role.descriptionRich
  })
</script>

<div class="flex justify-between items-start gap-4 flex-wrap">
  <div class="flex flex-col">
    <div class="sc-page-title">{role.name}</div>
  </div>

  {#if canEdit}
    <div class="sc-actions">
      <button
        class="sc-btn secondary"
        type="button"
        onclick={openEditRoleModal}
      >
        Edit Role
      </button>
      <form method="POST" action="?/deleteRole" onsubmit={confirmDeleteRole}>
        <input type="hidden" name="role_id" value={role.id} />
        <button class="sc-btn secondary" type="submit">Delete Role</button>
      </form>
    </div>
  {/if}
</div>

{#if form?.deleteRoleError}
  <div class="sc-form-error sc-stack-top-10">{form.deleteRoleError}</div>
{/if}

<ScModal
  bind:open={isEditRoleModalOpen}
  title="Edit Role"
  description="Update ownership details and role context."
  maxWidth="760px"
>
  <form class="sc-form" method="POST" action="?/updateRole">
    <input type="hidden" name="role_id" value={role.id} />
    {#if form?.updateRoleError}
      <div class="sc-form-error">{form.updateRoleError}</div>
    {/if}
    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="name"
        placeholder="Role name"
        bind:value={roleNameDraft}
        required
      />
    </div>
    <div class="sc-form-row">
      <RichTextEditor
        fieldName="description_rich"
        textFieldName="description"
        htmlValue={role.descriptionHtml}
        bind:textValue={roleDescriptionDraft}
        bind:richValue={roleDescriptionRichDraft}
      />
    </div>
    <div class="sc-form-actions">
      <div class="sc-page-subtitle">
        Linked process/system views update from this role record.
      </div>
      <button class="sc-btn" type="submit">Save Role</button>
    </div>
  </form>
</ScModal>
