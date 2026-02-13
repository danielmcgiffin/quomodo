<script lang="ts">
  type WorkspaceRole = "owner" | "admin" | "editor" | "member"

  type Props = {
    data: {
      org: {
        orgId: string
        orgName: string
        membershipRole: WorkspaceRole
      }
      canRenameWorkspace: boolean
      created: boolean
      renamed: boolean
      switched: boolean
      workspaces: {
        id: string
        name: string
        role: WorkspaceRole
        isCurrent: boolean
        isOwned: boolean
      }[]
    }
    form?: {
      createWorkspaceError?: string
      createWorkspaceNameDraft?: string
      renameWorkspaceError?: string
      renameWorkspaceNameDraft?: string
      switchWorkspaceError?: string
    }
  }

  let { data, form }: Props = $props()
</script>

<div class="sc-page">
  <div class="sc-page-head">
    <div class="flex flex-col">
      <div class="sc-page-title text-2xl font-bold">Workspace</div>
      <div class="sc-page-subtitle">
        Manage your current workspace and create additional workspaces.
      </div>
    </div>
  </div>

  {#if data.created}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Workspace created.</div>
      <div class="sc-muted-line sc-stack-top-6">
        You are now operating in your newest workspace context.
      </div>
    </div>
  {/if}

  {#if data.renamed}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Workspace name updated.</div>
      <div class="sc-muted-line sc-stack-top-6">Your navigation now uses the new name.</div>
    </div>
  {/if}

  {#if data.switched}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Workspace switched.</div>
      <div class="sc-muted-line sc-stack-top-6">
        All app pages now resolve in the selected workspace context.
      </div>
    </div>
  {/if}

  <section class="sc-card sc-stack-top-12">
    <div class="font-semibold">Current workspace</div>
    <div class="sc-muted-line sc-stack-top-6">
      {data.org.orgName} ({data.org.membershipRole})
    </div>
    {#if data.canRenameWorkspace}
      <form class="sc-form sc-stack-top-10" method="POST" action="?/renameWorkspace">
        {#if form?.renameWorkspaceError}
          <div class="sc-form-error">{form.renameWorkspaceError}</div>
        {/if}
        <div class="sc-form-row">
          <input
            class="sc-search sc-field"
            type="text"
            name="name"
            value={form?.renameWorkspaceNameDraft ?? data.org.orgName}
            maxlength="80"
            placeholder="Workspace name"
            required
          />
        </div>
        <div class="sc-form-actions">
          <button class="sc-btn" type="submit">Rename workspace</button>
        </div>
      </form>
    {:else}
      <div class="sc-muted-line sc-stack-top-8">
        Only owners and admins can rename this workspace.
      </div>
    {/if}
  </section>

  <section class="sc-card sc-stack-top-12">
    <div class="font-semibold">Create workspace</div>
    <div class="sc-muted-line sc-stack-top-6">
      Create another workspace for a new customer or separate operating context.
    </div>
    <form class="sc-form sc-stack-top-10" method="POST" action="?/createWorkspace">
      {#if form?.createWorkspaceError}
        <div class="sc-form-error">{form.createWorkspaceError}</div>
      {/if}
      <div class="sc-form-row">
        <input
          class="sc-search sc-field"
          type="text"
          name="name"
          value={form?.createWorkspaceNameDraft ?? ""}
          maxlength="80"
          placeholder="New workspace name"
          required
        />
      </div>
      <div class="sc-form-actions">
        <button class="sc-btn" type="submit">Create workspace</button>
      </div>
    </form>
  </section>

  <section class="sc-card sc-stack-top-12">
    <div class="font-semibold">Your memberships</div>
    <div class="sc-muted-line sc-stack-top-6">
      Switch your active workspace here or from the app navigation switcher.
    </div>
    {#if form?.switchWorkspaceError}
      <div class="sc-form-error sc-stack-top-8">{form.switchWorkspaceError}</div>
    {/if}

    {#if data.workspaces.length === 0}
      <div class="sc-muted-line sc-stack-top-10">No memberships found.</div>
    {:else}
      <div class="sc-stack-top-10 flex flex-col gap-2">
        {#each data.workspaces as workspace (workspace.id)}
          <div class="sc-form-row rounded-[var(--sc-radius-md)] border border-[var(--sc-border)] bg-[var(--sc-bg-inset)] p-3">
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="truncate font-semibold">{workspace.name}</div>
              <div class="sc-muted-line">Role: {workspace.role}</div>
            </div>
            <div class="flex items-center gap-2">
              {#if workspace.isCurrent}
                <span class="sc-pill">Current</span>
              {:else}
                <form method="POST" action="?/switchWorkspace">
                  <input type="hidden" name="workspaceId" value={workspace.id} />
                  <input type="hidden" name="redirectTo" value="/app/workspace?switched=1" />
                  <button class="sc-btn secondary" type="submit">Switch</button>
                </form>
              {/if}
              {#if workspace.isOwned}
                <span class="sc-pill">Owner</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
