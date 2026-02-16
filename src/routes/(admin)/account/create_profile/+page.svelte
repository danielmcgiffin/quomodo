<script lang="ts">
  import { applyAction, enhance } from "$app/forms"
  import type { SubmitFunction } from "@sveltejs/kit"

  interface User {
    email: string
  }

  interface Profile {
    full_name?: string
    company_name?: string
    website?: string
  }

  interface Props {
    data: { user: User; profile: Profile }
    form: FormAccountUpdateResult
  }

  let { data, form }: Props = $props()

  const profile = $derived(data.profile)

  let loading = $state(false)
  let fullName: string = $state("")
  let companyName: string = $state("")
  let website: string = $state("")

  $effect(() => {
    if (fullName || companyName || website) {
      return
    }
    fullName = profile?.full_name ?? ""
    companyName = profile?.company_name ?? ""
    website = profile?.website ?? ""
  })

  const fieldError = (liveForm: FormAccountUpdateResult, name: string) => {
    let errors = liveForm?.errorFields ?? []
    return errors.includes(name)
  }

  const handleSubmit: SubmitFunction = () => {
    loading = true
    return async ({ update, result }) => {
      await update({ reset: false })
      await applyAction(result)
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Create Profile</title>
</svelte:head>

<div class="sc-page max-w-lg">
  <div class="sc-card p-8">
    <div class="sc-page-head" style="margin-bottom: 24px;">
      <div class="sc-page-title text-2xl font-bold">Create Profile</div>
    </div>

    <form
      class="sc-form"
      method="POST"
      action="/account/api?/updateProfile"
      use:enhance={handleSubmit}
    >
      <div class="sc-form-row">
        <div class="flex-1">
          <label for="fullName" class="sc-meta mb-1 block">Your Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Your full name"
            class="sc-search sc-field w-full {fieldError(form, 'fullName') ? 'sc-field--error' : ''}"
            value={form?.fullName ?? fullName}
            maxlength="50"
            required
          />
        </div>
      </div>

      <div class="sc-form-row">
        <div class="flex-1">
          <label for="companyName" class="sc-meta mb-1 block">Company Name</label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            placeholder="Company name"
            class="sc-search sc-field w-full {fieldError(form, 'companyName') ? 'sc-field--error' : ''}"
            value={form?.companyName ?? companyName}
            maxlength="50"
            required
          />
        </div>
      </div>

      <div class="sc-form-row">
        <div class="flex-1">
          <label for="website" class="sc-meta mb-1 block">Company Website</label>
          <input
            id="website"
            name="website"
            type="text"
            placeholder="https://example.com"
            class="sc-search sc-field w-full {fieldError(form, 'website') ? 'sc-field--error' : ''}"
            value={form?.website ?? website}
            maxlength="50"
          />
        </div>
      </div>

      {#if form?.errorMessage}
        <div class="sc-form-error mb-4">
          {form?.errorMessage}
        </div>
      {/if}

      <div class="sc-form-actions">
        <button
          type="submit"
          class="sc-btn w-full"
          disabled={loading}
        >
          {loading ? "Updating..." : "Create Profile"}
        </button>
      </div>
    </form>

    <div class="sc-muted-line sc-stack-top-12 text-center text-sm">
      Logged in as <strong>{data.user?.email}</strong>.
      <br />
      <a class="text-[var(--sc-green)] hover:underline" href="/account/sign_out">Sign out</a>
    </div>
  </div>
</div>
