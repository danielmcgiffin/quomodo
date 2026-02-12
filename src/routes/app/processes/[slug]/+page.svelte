<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
  import ScModal from "$lib/components/ScModal.svelte"
  import InlineCreateRoleModal from "$lib/components/InlineCreateRoleModal.svelte"
  import InlineCreateSystemModal from "$lib/components/InlineCreateSystemModal.svelte"
  import InlineEntityFlagControl from "$lib/components/InlineEntityFlagControl.svelte"

  let { data, form } = $props()

  type SidebarRole = {
    id: string
    slug: string
    name: string
    initials: string
  }

  type SidebarSystem = {
    id: string
    slug: string
    name: string
  }

  type ActionEntry = {
    id: string
    sequence: number
    descriptionHtml: string
    ownerRole: SidebarRole | null
    system: SidebarSystem | null
  }

  const uniqueById = <T extends { id: string }>(
    items: (T | null | undefined)[],
  ): T[] => {
    const seen = new Set<string>()
    const result: T[] = []
    for (const item of items) {
      if (!item || seen.has(item.id)) {
        continue
      }
      seen.add(item.id)
      result.push(item)
    }
    return result
  }

  const normalizeMentionHandle = (value: string): string =>
    value
      .toLowerCase()
      .trim()
      .replace(/^@+/, "")
      .replace(/[^a-z0-9_-]+/g, "")

  const mentionPattern = /@([a-z0-9][a-z0-9_-]*)/gi

  const extractMentionHandles = (html: string): string[] => {
    const text = html.replace(/<[^>]*>/g, " ")
    const mentions = new Set<string>()
    for (const match of text.matchAll(mentionPattern)) {
      const mention = normalizeMentionHandle(match[1] ?? "")
      if (mention) {
        mentions.add(mention)
      }
    }
    return Array.from(mentions)
  }

  const roleMatchesHandle = (role: SidebarRole, handle: string): boolean => {
    const normalized = normalizeMentionHandle(handle)
    if (!normalized) {
      return false
    }
    const roleKeys = [
      role.slug,
      role.name,
      role.name.replace(/\s+/g, "-"),
      role.name.replace(/\s+/g, "_"),
    ].map((value) => normalizeMentionHandle(value))
    return roleKeys.includes(normalized)
  }

  const actions = $derived.by(() => data.actions as unknown as ActionEntry[])
  const allRoles = $derived.by(() => data.allRoles as unknown as SidebarRole[])

  const actionRoles = $derived.by(() =>
    uniqueById(actions.map((action: ActionEntry) => action.ownerRole ?? null)),
  )
  const actionSystems = $derived.by(() =>
    uniqueById(actions.map((action: ActionEntry) => action.system ?? null)),
  )

  const mentionHandles = $derived.by(() =>
    Array.from(
      new Set(
        actions.flatMap((action: ActionEntry) =>
          extractMentionHandles(action.descriptionHtml),
        ),
      ),
    ),
  )

  const relatedRoles = $derived.by(() =>
    uniqueById(
      mentionHandles
        .map((handle) =>
          allRoles.find((role: SidebarRole) => roleMatchesHandle(role, handle)),
        )
        .filter((role): role is SidebarRole => Boolean(role)),
    ),
  )

  const relatedHandlesWithoutRole = $derived.by(() =>
    mentionHandles.filter(
      (handle) =>
        !relatedRoles.some((role: SidebarRole) => roleMatchesHandle(role, handle)),
    ),
  )

  let isCreateActionModalOpen = $state(false)
  let isCreateRoleModalOpen = $state(false)
  let isCreateSystemModalOpen = $state(false)

  $effect(() => {
    if (
      form?.createActionError ||
      form?.createRoleError ||
      form?.createRoleSuccess ||
      form?.createSystemError ||
      form?.createSystemSuccess
    ) {
      isCreateActionModalOpen = true
    }
    if (form?.createRoleError) {
      isCreateRoleModalOpen = true
    }
    if (form?.createSystemError) {
      isCreateSystemModalOpen = true
    }
  })
</script>

<div class="sc-page">
  <div class="sc-page-title">{data.process.name}</div>
  <div class="sc-page-subtitle">
    <RichText html={data.process.descriptionHtml} />
  </div>

  <div class="sc-process-layout">
    <div class="sc-process-main">
      <div class="sc-section">
        <div class="sc-section-title">Process Details</div>
        <div class="sc-process-facts sc-entity-card">
          <InlineEntityFlagControl
            action="?/createFlag"
            targetType="process"
            targetId={data.process.id}
            entityLabel={data.process.name}
            viewerRole={data.viewerRole}
            errorMessage={form?.createFlagError}
            errorTargetType={form?.createFlagTargetType}
            errorTargetId={form?.createFlagTargetId}
          />
          <div class="sc-card sc-process-fact">
            <div class="sc-process-fact-label">Trigger</div>
            <div class="sc-process-fact-value">{data.process.trigger || "Not set"}</div>
          </div>
          <div class="sc-card sc-process-fact">
            <div class="sc-process-fact-label">End State</div>
            <div class="sc-process-fact-value">{data.process.endState || "Not set"}</div>
          </div>
        </div>
      </div>

      <div class="sc-section">
        <div class="flex justify-between items-center gap-4 flex-wrap">
          <div class="sc-section-title">What Happens?</div>
          <button
            class="sc-btn"
            type="button"
            onclick={() => {
              isCreateActionModalOpen = true
            }}
          >
            Write an Action
          </button>
        </div>
        {#each actions as action}
          <div class="sc-card sc-entity-card">
            <InlineEntityFlagControl
              action="?/createFlag"
              targetType="action"
              targetId={action.id}
              entityLabel={`Action ${action.sequence}`}
              viewerRole={data.viewerRole}
              errorMessage={form?.createFlagError}
              errorTargetType={form?.createFlagTargetType}
              errorTargetId={form?.createFlagTargetId}
            />
            <div class="sc-meta">Action {action.sequence}</div>
            <div
              style="font-size: var(--sc-font-lg); font-weight: 600; margin-top:6px;"
            >
              <RichText html={action.descriptionHtml} />
            </div>
            <div class="sc-byline" style="margin-top:10px;">
              {#if action.ownerRole}
                <RolePortal role={action.ownerRole} />
              {/if}
              {#if action.system}
                <span>· in</span>
                <SystemPortal system={action.system} />
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if data.processFlags.length}
        <div class="sc-section">
          <div class="sc-section-title">What's Broken?</div>
          {#each data.processFlags as flag}
            <div class="sc-card sc-card-flag">
              <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
              <div style="margin-top:10px;">{flag.message}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <aside class="sc-process-sidebar">
      <div class="sc-section">
        <div class="sc-section-title sc-sidebar-title">Who Does It</div>
        <div class="sc-card">
          <div class="sc-byline">
            {#if actionRoles.length === 0}
              <span class="sc-page-subtitle">No action owners yet.</span>
            {:else}
              {#each actionRoles as role}
                <RolePortal {role} />
              {/each}
            {/if}
          </div>
        </div>
      </div>

      <div class="sc-section">
        <div class="sc-section-title sc-sidebar-title">What Systems</div>
        <div class="sc-card">
          <div class="sc-byline">
            {#if actionSystems.length === 0}
              <span class="sc-page-subtitle">No systems linked yet.</span>
            {:else}
              {#each actionSystems as system}
                <SystemPortal {system} />
              {/each}
            {/if}
          </div>
        </div>
      </div>

      {#if mentionHandles.length > 0}
        <div class="sc-section">
          <div class="sc-section-title sc-sidebar-title">Related Roles</div>
          <div class="sc-card">
            <div class="sc-byline">
              {#each relatedRoles as role}
                <RolePortal {role} />
              {/each}
              {#each relatedHandlesWithoutRole as handle}
                <span class="sc-pill">@{handle}</span>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </aside>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Traverse</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#if actionRoles.length === 0 && actionSystems.length === 0}
          <span class="sc-page-subtitle">Add actions to build traversal links.</span>
        {:else}
          {#each actionRoles as role}
            <RolePortal {role} />
          {/each}
          {#if actionRoles.length > 0 && actionSystems.length > 0}
            <span>·</span>
          {/if}
          {#each actionSystems as system}
            <SystemPortal {system} />
          {/each}
          <span>·</span>
          <ProcessPortal process={data.process} />
        {/if}
      </div>
    </div>
  </div>

  <ScModal
    bind:open={isCreateActionModalOpen}
    title="Add Action"
    description="Capture one action in this process and link role + system."
    maxWidth="760px"
  >
    <form class="sc-form" method="POST" action="?/createAction">
      {#if form?.createActionError}
        <div class="sc-form-error">{form.createActionError}</div>
      {/if}
      <div class="sc-form-row">
        <input
          class="sc-search sc-field"
          name="sequence"
          placeholder="Sequence (optional)"
        />
      </div>
      <div class="sc-form-row">
        <select class="sc-search sc-field" name="owner_role_id" required>
          <option value="">Role responsible</option>
          {#each data.allRoles as role}
            <option value={role.id} selected={form?.createdRoleId === role.id}
              >{role.name}</option
            >
          {/each}
        </select>
        <select class="sc-search sc-field" name="system_id" required>
          <option value="">System</option>
          {#each data.allSystems as system}
            <option
              value={system.id}
              selected={form?.createdSystemId === system.id}
              >{system.name}</option
            >
          {/each}
        </select>
      </div>
      <div class="sc-form-row">
        <button
          class="sc-btn secondary"
          type="button"
          onclick={() => {
            isCreateRoleModalOpen = true
          }}
        >
          Create Role
        </button>
        <button
          class="sc-btn secondary"
          type="button"
          onclick={() => {
            isCreateSystemModalOpen = true
          }}
        >
          Create System
        </button>
      </div>
      <div class="sc-form-row">
        <textarea
          class="sc-search sc-field sc-textarea"
          name="description"
          placeholder="Action description"
          rows="4"
          required
        ></textarea>
      </div>
      <div class="sc-form-actions">
        <div class="sc-page-subtitle">
          Actions appear in sequence and become part of portal traversal.
        </div>
        <button class="sc-btn" type="submit">Create Action</button>
      </div>
      {#if form?.createRoleSuccess}
        <div class="sc-page-subtitle">Role created. It is preselected above.</div>
      {/if}
      {#if form?.createSystemSuccess}
        <div class="sc-page-subtitle">System created. It is preselected above.</div>
      {/if}
    </form>
  </ScModal>

  <InlineCreateRoleModal
    bind:open={isCreateRoleModalOpen}
    action="?/createRole"
    errorMessage={form?.createRoleError}
    description="Create a role without leaving action authoring."
    helperText="This role is immediately available for action ownership."
  />

  <InlineCreateSystemModal
    bind:open={isCreateSystemModalOpen}
    action="?/createSystem"
    roles={data.allRoles}
    selectedRoleId={form?.createdRoleId}
    errorMessage={form?.createSystemError}
    description="Create a system without leaving action authoring."
    helperText="This system is immediately available for action linking."
  />
</div>
