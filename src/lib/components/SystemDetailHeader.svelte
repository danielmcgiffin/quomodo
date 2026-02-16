<script lang="ts">
  import RichText from "$lib/components/RichText.svelte"
  import RichTextEditor from "$lib/components/RichTextEditor.svelte"
  import ScModal from "$lib/components/ScModal.svelte"

  type SidebarRole = {
    id: string
    slug: string
    name: string
    initials: string
  }

  type SystemData = {
    id: string
    slug: string
    name: string
    descriptionRich: string
    descriptionHtml: string
    location: string
    ownerRole: SidebarRole | null
  }

  type SystemForm = {
    updateSystemError?: string
    deleteSystemError?: string
    systemNameDraft?: string
    systemDescriptionDraft?: string
    systemDescriptionRichDraft?: string
    systemLocationDraft?: string
    selectedOwnerRoleIdDraft?: string
  }

  type Props = {
    system: SystemData
    allRoles: SidebarRole[]
    canEdit: boolean
    form?: SystemForm
  }

  let { system, allRoles, canEdit, form }: Props = $props()

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

  let isEditSystemModalOpen = $state(false)
  let systemNameDraft = $state("")
  let systemLocationDraft = $state("")
  let systemDescriptionDraft = $state("")
  let systemDescriptionRichDraft = $state("")
  let selectedOwnerRoleId = $state("")

  const setSystemDraftsFromData = () => {
    systemNameDraft = system.name
    systemLocationDraft = system.location
    systemDescriptionDraft = htmlToDraftText(system.descriptionHtml)
    systemDescriptionRichDraft = system.descriptionRich
    selectedOwnerRoleId = system.ownerRole?.id ?? ""
  }

  const openEditSystemModal = () => {
    setSystemDraftsFromData()
    isEditSystemModalOpen = true
  }

  const confirmDeleteSystem = (event: SubmitEvent) => {
    const shouldDelete = confirm(
      "Delete this system? Roles and processes keep their records, but actions linked to this system must be reassigned first.",
    )
    if (!shouldDelete) {
      event.preventDefault()
    }
  }

  $effect(() => {
    if (form?.updateSystemError) {
      isEditSystemModalOpen = true
    }
    systemNameDraft =
      typeof form?.systemNameDraft === "string"
        ? form.systemNameDraft
        : system.name
    systemDescriptionDraft =
      typeof form?.systemDescriptionDraft === "string"
        ? form.systemDescriptionDraft
        : htmlToDraftText(system.descriptionHtml)
    systemDescriptionRichDraft =
      typeof form?.systemDescriptionRichDraft === "string"
        ? form.systemDescriptionRichDraft
        : system.descriptionRich
    systemLocationDraft =
      typeof form?.systemLocationDraft === "string"
        ? form.systemLocationDraft
        : system.location
    selectedOwnerRoleId =
      typeof form?.selectedOwnerRoleIdDraft === "string"
        ? form.selectedOwnerRoleIdDraft
        : (system.ownerRole?.id ?? "")
  })
</script>

<div class="flex justify-between items-start gap-4 flex-wrap">
  <div class="flex flex-col">
    <div class="sc-page-title">{system.name}</div>
  </div>

  {#if canEdit}
    <div class="sc-actions">
      <button
        class="sc-btn secondary"
        type="button"
        onclick={openEditSystemModal}
      >
        Edit System
      </button>
      <form
        method="POST"
        action="?/deleteSystem"
        onsubmit={confirmDeleteSystem}
      >
        <input type="hidden" name="system_id" value={system.id} />
        <button class="sc-btn secondary" type="submit">Delete System</button>
      </form>
    </div>
  {/if}
</div>

{#if form?.deleteSystemError}
  <div class="sc-form-error sc-stack-top-10">
    {form.deleteSystemError}
  </div>
{/if}

<ScModal
  bind:open={isEditSystemModalOpen}
  title="Edit System"
  description="Update ownership and context for this system."
  maxWidth="760px"
>
  <form class="sc-form" method="POST" action="?/updateSystem">
    <input type="hidden" name="system_id" value={system.id} />
    {#if form?.updateSystemError}
      <div class="sc-form-error">{form.updateSystemError}</div>
    {/if}
    <div class="sc-form-row">
      <input
        class="sc-search sc-field"
        name="name"
        placeholder="System name"
        bind:value={systemNameDraft}
        required
      />
      <input
        class="sc-search sc-field"
        name="location"
        placeholder="Location (URL or app section)"
        bind:value={systemLocationDraft}
      />
    </div>
    <div class="sc-form-row">
      <select
        class="sc-search sc-field"
        name="owner_role_id"
        bind:value={selectedOwnerRoleId}
      >
        <option value="">Owner role (optional)</option>
        {#each allRoles as role}
          <option value={role.id}>{role.name}</option>
        {/each}
      </select>
    </div>
    <div class="sc-form-row">
      <RichTextEditor
        fieldName="description_rich"
        textFieldName="description"
        htmlValue={system.descriptionHtml}
        bind:textValue={systemDescriptionDraft}
        bind:richValue={systemDescriptionRichDraft}
      />
    </div>
    <div class="sc-form-actions">
      <div class="sc-page-subtitle">
        Owner linkage updates immediately for system detail and traversals.
      </div>
      <button class="sc-btn" type="submit">Save System</button>
    </div>
  </form>
</ScModal>
