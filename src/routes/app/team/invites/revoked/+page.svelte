<script lang="ts">
  type WorkspaceRole = "owner" | "admin" | "editor" | "member"

  type Props = {
    data: {
      org: {
        orgName: string
        membershipRole?: WorkspaceRole
      }
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
      }[]
    }
  }

  let { data }: Props = $props()
</script>

<div class="sc-page">
  <div class="sc-page-head">
    <div class="flex items-center gap-4">
      <a href="/app/team" class="sc-icon-btn" title="Back to Team">
        <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </a>
      <div class="flex flex-col">
        <div class="sc-page-title text-2xl font-bold">Revoked Invitations</div>
        <div class="sc-page-subtitle">
          History of revoked team access for {data.org.orgName}.
        </div>
      </div>
    </div>
  </div>

  <section class="sc-card sc-stack-top-12">
    {#if data.invites.length === 0}
      <div class="sc-muted-line">No revoked invitations found.</div>
    {:else}
      <div class="flex flex-col gap-2">
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
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
