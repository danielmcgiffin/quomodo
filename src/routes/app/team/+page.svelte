<script lang="ts">
  type WorkspaceRole = "owner" | "admin" | "editor" | "member"

  type Props = {
    data: {
      org: {
        orgName: string
        membershipRole?: WorkspaceRole
      }
      updated: boolean
      removed: boolean
      inviteCreated: boolean
      inviteRevoked: boolean
      ownershipTransferInitiated: boolean
      ownershipTransferCancelled: boolean
      ownershipTransferAccepted: boolean
      inviteRoleOptions: WorkspaceRole[]
      canTransferOwnership: boolean
      pendingOwnershipTransfer: {
        id: string
        recipientName: string
        recipientUserId: string
        createdAt: string
        expiresAt: string
        priorOwnerDisposition: "admin" | "editor" | "leave"
      } | null
      ownershipTransferRecipients: {
        userId: string
        displayName: string
      }[]
      members: {
        id: string
        userId: string
        displayName: string
        role: WorkspaceRole
        invitedAt: string
        acceptedAt: string
        isSelf: boolean
        canChangeRole: boolean
        canRemoveMember: boolean
        roleOptions: WorkspaceRole[]
      }[]
      invites: {
        id: string
        email: string
        role: WorkspaceRole
        status: "pending" | "accepted" | "revoked" | "expired" | "invalid"
        invitedAt: string
        expiresAt: string
        acceptedAt: string
        revokedAt: string
        invitedBy: string
        canRevoke: boolean
      }[]
    }
    form?: {
      updateMemberRoleError?: string
      removeMemberError?: string
      createInviteError?: string
      revokeInviteError?: string
      inviteEmailDraft?: string
      ownershipTransferError?: string
      cancelOwnershipTransferError?: string
    }
  }

  let { data, form }: Props = $props()
</script>

<div class="sc-page">
  <div class="sc-page-head">
    <div class="flex flex-col">
      <div class="sc-page-title text-2xl font-bold">Team</div>
      <div class="sc-page-subtitle">
        Manage member roles and access for {data.org.orgName}.
      </div>
    </div>
  </div>

  {#if data.updated}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Member role updated.</div>
      <div class="sc-muted-line sc-stack-top-6">
        Team permissions now reflect the selected role.
      </div>
    </div>
  {/if}

  {#if data.removed}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Member removed.</div>
      <div class="sc-muted-line sc-stack-top-6">
        Workspace access for that user has been revoked.
      </div>
    </div>
  {/if}

  {#if data.inviteCreated}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Invite sent.</div>
      <div class="sc-muted-line sc-stack-top-6">
        A stored invite is active and can be accepted from the email link.
      </div>
    </div>
  {/if}

  {#if data.inviteRevoked}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Invite revoked.</div>
      <div class="sc-muted-line sc-stack-top-6">
        That invite link is no longer valid.
      </div>
    </div>
  {/if}

  {#if data.ownershipTransferInitiated}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Ownership transfer initiated.</div>
      <div class="sc-muted-line sc-stack-top-6">
        The recipient has been notified and must accept the transfer to complete
        it.
      </div>
    </div>
  {/if}

  {#if data.ownershipTransferCancelled}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Ownership transfer cancelled.</div>
    </div>
  {/if}

  {#if data.ownershipTransferAccepted}
    <div class="sc-card sc-stack-top-12">
      <div class="font-semibold">Ownership transfer accepted.</div>
      <div class="sc-muted-line sc-stack-top-6">
        Workspace ownership and roles have been updated.
      </div>
    </div>
  {/if}

  {#if form?.updateMemberRoleError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.updateMemberRoleError}</div>
    </div>
  {/if}

  {#if form?.removeMemberError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.removeMemberError}</div>
    </div>
  {/if}

  {#if form?.createInviteError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.createInviteError}</div>
    </div>
  {/if}

  {#if form?.revokeInviteError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.revokeInviteError}</div>
    </div>
  {/if}

  {#if form?.ownershipTransferError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.ownershipTransferError}</div>
    </div>
  {/if}

  {#if form?.cancelOwnershipTransferError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.cancelOwnershipTransferError}</div>
    </div>
  {/if}

  {#if data.canTransferOwnership}
    <section class="sc-card sc-stack-top-12">
      <div class="font-semibold">Ownership transfer</div>
      <div class="sc-muted-line sc-stack-top-6">
        Transfer ownership to an existing accepted admin. The recipient must
        accept to complete the handoff.
      </div>

      {#if data.pendingOwnershipTransfer}
        <div
          class="sc-stack-top-10 rounded-[var(--sc-radius-md)] border border-[var(--sc-border)] bg-[var(--sc-bg-inset)] p-3"
        >
          <div class="font-semibold">Pending transfer</div>
          <div class="sc-muted-line sc-stack-top-6">
            Recipient: {data.pendingOwnershipTransfer.recipientName}
          </div>
          <div class="sc-muted-line sc-stack-top-6">
            Created: {data.pendingOwnershipTransfer.createdAt} • Expires: {data
              .pendingOwnershipTransfer.expiresAt}
          </div>
          <div class="sc-muted-line sc-stack-top-6">
            After transfer, you will: {data.pendingOwnershipTransfer
              .priorOwnerDisposition === "leave"
              ? "leave the workspace"
              : `stay as ${data.pendingOwnershipTransfer.priorOwnerDisposition}`}
          </div>
          <div class="sc-stack-top-10">
            <form method="POST" action="?/cancelOwnershipTransfer">
              <button class="sc-btn secondary" type="submit"
                >Cancel transfer</button
              >
            </form>
          </div>
        </div>
      {:else if data.ownershipTransferRecipients.length === 0}
        <div class="sc-muted-line sc-stack-top-10">
          No eligible recipients found. The recipient must be an accepted admin
          member.
        </div>
      {:else}
        <form
          class="sc-form sc-stack-top-10"
          method="POST"
          action="?/initiateOwnershipTransfer"
        >
          <div class="sc-form-row">
            <select class="sc-search sc-field" name="recipientUserId" required>
              <option value="" disabled selected>Select admin recipient</option>
              {#each data.ownershipTransferRecipients as recipient (recipient.userId)}
                <option value={recipient.userId}>{recipient.displayName}</option
                >
              {/each}
            </select>
          </div>

          <div class="sc-stack-top-10">
            <div class="font-semibold">After transfer</div>
            <div class="sc-muted-line sc-stack-top-6">
              Choose what happens to your access after ownership moves.
            </div>
            <div class="sc-stack-top-8 flex flex-col gap-2">
              <label class="sc-form-row items-center gap-2">
                <input
                  type="radio"
                  name="priorOwnerDisposition"
                  value="admin"
                  checked
                />
                <span>Stay as admin</span>
              </label>
              <label class="sc-form-row items-center gap-2">
                <input
                  type="radio"
                  name="priorOwnerDisposition"
                  value="editor"
                />
                <span>Stay as editor</span>
              </label>
              <label class="sc-form-row items-center gap-2">
                <input
                  type="radio"
                  name="priorOwnerDisposition"
                  value="leave"
                />
                <span>Leave workspace</span>
              </label>
            </div>
          </div>

          <div class="sc-form-actions sc-stack-top-10">
            <button class="sc-btn" type="submit">Initiate transfer</button>
          </div>
        </form>
      {/if}
    </section>
  {/if}

  <section class="sc-card sc-stack-top-12">
    <div class="font-semibold">Invite teammate</div>
    <div class="sc-muted-line sc-stack-top-6">
      Invites are persisted, role-scoped, and can be revoked before acceptance.
    </div>
    <form class="sc-form sc-stack-top-10" method="POST" action="?/createInvite">
      <div class="sc-form-row">
        <input
          class="sc-search sc-field"
          type="email"
          name="email"
          value={form?.inviteEmailDraft ?? ""}
          placeholder="teammate@example.com"
          autocomplete="email"
          required
        />
        <select class="sc-search sc-field" name="role" required>
          {#each data.inviteRoleOptions as roleOption (roleOption)}
            <option value={roleOption}>{roleOption}</option>
          {/each}
        </select>
      </div>
      <div class="sc-form-actions">
        <button class="sc-btn" type="submit">Send invite</button>
      </div>
    </form>
  </section>

  <section class="sc-card sc-stack-top-12">
    <div class="font-semibold">Invite history</div>
    <div class="sc-muted-line sc-stack-top-6">
      Pending, accepted, revoked, and expired invites are tracked here.
    </div>

    {#if data.invites.length === 0}
      <div class="sc-muted-line sc-stack-top-10">No invites found.</div>
    {:else}
      <div class="sc-stack-top-10 flex flex-col gap-2">
        {#each data.invites as invite (invite.id)}
          <div
            class="rounded-[var(--sc-radius-md)] border border-[var(--sc-border)] bg-[var(--sc-bg-inset)] p-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="truncate font-semibold">{invite.email}</div>
                <div class="sc-muted-line sc-stack-top-6">
                  Role: {invite.role} • Status: {invite.status}
                </div>
                <div class="sc-muted-line sc-stack-top-6">
                  Invited: {invite.invitedAt} by {invite.invitedBy}
                </div>
                <div class="sc-muted-line sc-stack-top-6">
                  Expires: {invite.expiresAt} • Accepted: {invite.acceptedAt} • Revoked:
                  {invite.revokedAt}
                </div>
              </div>
              {#if invite.canRevoke}
                <form method="POST" action="?/revokeInvite">
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <button class="sc-btn secondary" type="submit">Revoke</button>
                </form>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="sc-card sc-stack-top-12">
    <div class="font-semibold">Members</div>
    <div class="sc-muted-line sc-stack-top-6">
      Role changes and removals apply immediately. Ownership transfer requires
      acceptance.
    </div>

    {#if data.members.length === 0}
      <div class="sc-muted-line sc-stack-top-10">No members found.</div>
    {:else}
      <div class="sc-stack-top-10 flex flex-col gap-2">
        {#each data.members as member (member.id)}
          <div
            class="rounded-[var(--sc-radius-md)] border border-[var(--sc-border)] bg-[var(--sc-bg-inset)] p-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="truncate font-semibold">{member.displayName}</div>
                <div class="sc-muted-line sc-stack-top-6">
                  {member.userId}
                </div>
                <div class="sc-muted-line sc-stack-top-6">
                  Invited: {member.invitedAt} • Joined: {member.acceptedAt}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="sc-pill">{member.role}</span>
                {#if member.isSelf}
                  <span class="sc-pill">You</span>
                {/if}
              </div>
            </div>

            {#if member.canChangeRole || member.canRemoveMember}
              <div class="sc-stack-top-10 flex flex-wrap items-center gap-2">
                {#if member.canChangeRole}
                  <form
                    class="sc-form-row"
                    method="POST"
                    action="?/updateMemberRole"
                  >
                    <input
                      type="hidden"
                      name="membershipId"
                      value={member.id}
                    />
                    <select
                      class="sc-search sc-field"
                      name="role"
                      value={member.role}
                      aria-label={`Change role for ${member.displayName}`}
                    >
                      {#each member.roleOptions as roleOption (roleOption)}
                        <option value={roleOption}>{roleOption}</option>
                      {/each}
                    </select>
                    <button class="sc-btn secondary" type="submit"
                      >Update role</button
                    >
                  </form>
                {/if}

                {#if member.canRemoveMember}
                  <form method="POST" action="?/removeMember">
                    <input
                      type="hidden"
                      name="membershipId"
                      value={member.id}
                    />
                    <button class="sc-btn secondary" type="submit"
                      >Remove member</button
                    >
                  </form>
                {/if}
              </div>
            {:else}
              <div class="sc-muted-line sc-stack-top-8">
                No team-management actions available for this member.
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
