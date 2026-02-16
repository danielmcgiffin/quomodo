<script lang="ts">
  import FlagsCreateForm from "$lib/components/FlagsCreateForm.svelte"
  import FlagsCardList from "$lib/components/FlagsCardList.svelte"
  import type { FlagsDashboardEntry } from "$lib/server/app/mappers/flags"

  type Props = {
    data: {
      viewerRole: "owner" | "admin" | "editor" | "member"
      targetOptions: { value: string; label: string }[]
      flags: FlagsDashboardEntry[]
    }
    form?: { createFlagError?: string }
  }

  let { data, form }: Props = $props()

  const canModerate = $derived.by(() =>
    ["owner", "admin", "editor"].includes(data.viewerRole),
  )
</script>

<div class="sc-process-page">
  <div class="grid grid-cols-1 md:grid-cols-4 items-center gap-4 mb-8">
    <div class="md:col-span-3">
      <div class="sc-page-title text-2xl font-bold" style="margin-bottom: 0;">Flags</div>
      <div class="sc-page-subtitle">
        Maintenance dashboard for rot across the atlas.
      </div>
    </div>

    <div class="flex md:justify-end">
      <FlagsCreateForm
        targetOptions={data.targetOptions}
        createFlagError={form?.createFlagError}
      />
    </div>
  </div>

  <FlagsCardList flags={data.flags} {canModerate} />
</div>
