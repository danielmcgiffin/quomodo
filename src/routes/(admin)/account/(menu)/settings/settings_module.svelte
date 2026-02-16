<script lang="ts">
  import { enhance, applyAction } from "$app/forms"
  import { page } from "$app/stores"
  import type { SubmitFunction } from "@sveltejs/kit"

  const fieldError = (liveForm: FormAccountUpdateResult, name: string) => {
    let errors = liveForm?.errorFields ?? []
    return errors.includes(name)
  }

  // Page state
  let loading = $state(false)
  let showSuccess = $state(false)

  type Field = {
    inputType?: string // default is "text"
    id: string
    label?: string
    initialValue: string | boolean
    placeholder?: string
    maxlength?: number
  }

  interface Props {
    // Module context
    editable?: boolean
    dangerous?: boolean
    title?: string
    message?: string
    fields: Field[]
    formTarget?: string
    successTitle?: string
    successBody?: string
    editButtonTitle?: string | null
    editLink?: string | null
    saveButtonTitle?: string
  }

  let {
    editable = false,
    dangerous = false,
    title = "",
    message = "",
    fields,
    formTarget = "",
    successTitle = "Success",
    successBody = "",
    editButtonTitle = null,
    editLink = null,
    saveButtonTitle = "Save",
  }: Props = $props()

  const handleSubmit: SubmitFunction = () => {
    loading = true
    return async ({ update, result }) => {
      await update({ reset: false })
      await applyAction(result)
      loading = false
      if (result.type === "success") {
        showSuccess = true
      }
    }
  }
</script>

<div class="sc-card p-6 pb-7 mt-8 max-w-2xl flex flex-col md:flex-row gap-6">
  {#if title}
    <div class="sc-section-title w-48 md:pr-8 flex-none" style="margin-bottom: 0;">{title}</div>
  {/if}

  <div class="w-full min-w-48">
    {#if !showSuccess}
      {#if message}
        <div class="mb-6 {dangerous ? 'sc-form-error' : 'sc-page-subtitle'}">
          {#if dangerous}
            <span class="mr-2">⚠️</span>
          {/if}

          <span>{message}</span>
        </div>
      {/if}
      <form
        class="sc-form flex flex-col"
        method="POST"
        action={formTarget}
        use:enhance={handleSubmit}
      >
        {#each fields as field}
          {#if field.label}
            <label for={field.id} class="sc-meta mb-1 block">
              {field.label}
            </label>
          {/if}
          {#if editable}
            <input
              id={field.id}
              name={field.id}
              type={field.inputType ?? "text"}
              disabled={!editable}
              placeholder={field.placeholder ?? field.label ?? ""}
              class="sc-search sc-field w-full mb-4 {fieldError($page?.form, field.id) ? 'sc-field--error' : ''}"
              value={$page.form ? $page.form[field.id] : field.initialValue}
              maxlength={field.maxlength ? field.maxlength : null}
            />
          {:else}
            <div class="sc-copy-md mb-4 font-semibold">{field.initialValue}</div>
          {/if}
        {/each}

        {#if $page?.form?.errorMessage}
          <div class="sc-form-error mb-4">
            {$page?.form?.errorMessage}
          </div>
        {/if}

        {#if editable}
          <div class="sc-form-actions">
            <button
              type="submit"
              class="sc-btn {dangerous ? 'secondary' : ''} min-w-[145px]"
              disabled={loading}
            >
              {loading ? "Saving..." : saveButtonTitle}
            </button>
          </div>
        {:else if editButtonTitle && editLink}
          <!-- !editable -->
          <div class="mt-1">
            <a href={editLink} class="sc-btn secondary min-w-[145px] block text-center">
              {editButtonTitle}
            </a>
          </div>
        {/if}
      </form>
    {:else}
      <!-- showSuccess -->
      <div class="sc-section">
        <div class="sc-section-title text-[var(--sc-green)]">{successTitle}</div>
        <div class="sc-copy-md mb-6">{successBody}</div>
        <a href="/account/settings" class="sc-btn secondary">
          Return to Settings
        </a>
      </div>
    {/if}
  </div>
</div>
