<script lang="ts">
  import CreateProcessModal from "$lib/components/CreateProcessModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import ProcessCardList from "$lib/components/ProcessCardList.svelte"
  import type { DirectFlagBadgeData, RelatedFlagBadgeData } from "$lib/flags"

  type RoleBadge = { id: string; slug: string; name: string; initials: string }
  type SystemBadge = { id: string; slug: string; name: string }
  type ProcessCard = {
    id: string
    slug: string
    name: string
    descriptionHtml: string
    roleBadges: RoleBadge[]
    systemBadges: SystemBadge[]
    directFlagData: DirectFlagBadgeData
    relatedFlagData: RelatedFlagBadgeData
  }
  type Props = {
    data: {
      org: { membershipRole: "owner" | "admin" | "editor" | "member" }
      roles: { id: string; name: string }[]
      processes: ProcessCard[]
    }
    form?: {
      createProcessError?: string
      createRoleError?: string
      createRoleSuccess?: boolean
      createdRoleId?: string
      createFlagError?: string
      createFlagTargetType?: string
      createFlagTargetId?: string
      createFlagTargetPath?: string
    }
  }

  let { data, form }: Props = $props()
  let isCreateProcessModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)

  $effect(() => {
    if (
      form?.createProcessError ||
      form?.createRoleError ||
      form?.createRoleSuccess
    ) {
      isCreateProcessModalOpen = true
    }
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
  })
</script>

<div class="sc-process-page">
  <CreateProcessModal
    bind:open={isCreateProcessModalOpen}
    roles={data.roles}
    createProcessError={form?.createProcessError}
    createRoleSuccess={form?.createRoleSuccess}
    createdRoleId={form?.createdRoleId}
    onOpenRoleModal={() => {
      isCreateRoleModalOpen = true
    }}
  />

  <InlineCreateRoleModal
    bind:open={isCreateRoleModalOpen}
    action="?/createRole"
    errorMessage={form?.createRoleError}
    description="Create a role without leaving process creation."
    helperText="This role is immediately available as process owner."
  />

  <div class="sc-process-layout sc-process-layout--single">
    <div class="sc-process-main">
      <div class="sc-page-head">
        <div class="flex flex-col">
          <div class="sc-page-title text-2xl font-bold">Processes</div>
          <div class="sc-page-subtitle">
            Write down how your work works, and save yourself the headache
            later.
          </div>
        </div>

        <div class="sc-actions">
          <button
            class="sc-btn"
            type="button"
            onclick={() => {
              isCreateProcessModalOpen = true
            }}
          >
            Write a Process
          </button>
        </div>
      </div>
      <ProcessCardList
        processes={data.processes}
        viewerRole={data.org.membershipRole}
        createFlagError={form?.createFlagError}
        createFlagTargetType={form?.createFlagTargetType}
        createFlagTargetId={form?.createFlagTargetId}
        createFlagTargetPath={form?.createFlagTargetPath}
      />
    </div>

  </div>
</div>
