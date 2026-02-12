<script lang="ts">
  import FlagsCreateForm from "$lib/components/FlagsCreateForm.svelte"
  import FlagsCardList from "$lib/components/FlagsCardList.svelte"
  import FlagSidebar from "$lib/components/FlagSidebar.svelte"
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

  const openFlags = $derived.by(() =>
    data.flags.filter((flag) => flag.status === "open"),
  )
</script>

<div class="sc-process-page">
  <div class="sc-process-layout">
    <div class="sc-process-main sc-rail-main">
      <div class="sc-page-title">Flags</div>
      <div class="sc-page-subtitle">
        Maintenance dashboard for rot across the atlas.
      </div>

      <FlagsCreateForm
        targetOptions={data.targetOptions}
        createFlagError={form?.createFlagError}
      />

      <FlagsCardList flags={data.flags} {canModerate} />
    </div>

    <aside class="sc-process-sidebar">
      <FlagSidebar
        title="Flags"
        flags={openFlags.map((flag) => ({
          id: flag.id,
          href: "/app/flags",
          flagType: flag.flagType ?? "flag",
          createdAt: flag.createdAt,
          message: flag.message,
          context:
            flag.targetType === "process" && flag.target
              ? flag.target.name
              : flag.targetType === "role" && flag.target
                ? flag.target.name
                : flag.targetType === "system" && flag.target
                  ? flag.target.name
                  : flag.targetType === "action" && flag.target
                    ? flag.target.label
                    : "Unknown",
          targetPath: flag.targetPath ?? undefined,
        }))}
        highlightedFlagId={null}
      />
    </aside>
  </div>
</div>
