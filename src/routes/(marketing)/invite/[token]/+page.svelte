<script lang="ts">
  import "../../../../app.css"

  type Props = {
    data: {
      invite: {
        id: string
        email: string
        role: "admin" | "editor" | "member"
        orgId: string
        orgName: string
        expiresAt: string
        acceptedAt: string | null
        revokedAt: string | null
      } | null
      inviteStatus: "pending" | "accepted" | "revoked" | "expired" | "invalid"
      signInUrl: string
      signUpUrl: string
      canAccept: boolean
      userAuthenticated: boolean
      userEmail: string | null
      userEmailMatchesInvite: boolean
    }
    form?: {
      acceptInviteError?: string
    }
  }

  let { data, form }: Props = $props()
</script>

<div class="sc-page">
  <div class="sc-page-head">
    <div class="flex flex-col">
      <div class="sc-page-title text-2xl font-bold">Workspace invite</div>
      <div class="sc-page-subtitle">
        Accept your invite to join SystemsCraft.
      </div>
    </div>
  </div>

  {#if form?.acceptInviteError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.acceptInviteError}</div>
    </div>
  {/if}

  {#if !data.invite}
    <section class="sc-card sc-stack-top-12">
      <div class="font-semibold">Invite not found.</div>
      <div class="sc-muted-line sc-stack-top-6">
        This invite link is invalid or no longer available.
      </div>
    </section>
  {:else}
    <section class="sc-card sc-stack-top-12">
      <div class="font-semibold">{data.invite.orgName}</div>
      <div class="sc-muted-line sc-stack-top-6">
        Invited email: {data.invite.email}
      </div>
      <div class="sc-muted-line sc-stack-top-6">
        Role on accept: {data.invite.role}
      </div>
      <div class="sc-muted-line sc-stack-top-6">
        Invite status: {data.inviteStatus}
      </div>
    </section>

    {#if data.inviteStatus === "pending" && !data.userAuthenticated}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Sign in to accept this invite.</div>
        <div class="sc-muted-line sc-stack-top-6">
          You can sign in with an existing account or sign up with {data.invite.email}.
        </div>
        <div class="sc-actions sc-stack-top-10">
          <a class="sc-btn" href={data.signInUrl}>Sign in</a>
          <a class="sc-btn secondary" href={data.signUpUrl}>Sign up</a>
        </div>
      </section>
    {/if}

    {#if data.inviteStatus === "pending" && data.userAuthenticated && !data.userEmailMatchesInvite}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Wrong account signed in.</div>
        <div class="sc-muted-line sc-stack-top-6">
          Signed in as {data.userEmail ?? "unknown user"}, but this invite belongs to
          {data.invite.email}.
        </div>
        <div class="sc-actions sc-stack-top-10">
          <a class="sc-btn secondary" href="/account/sign_out">Sign out</a>
          <a class="sc-btn" href={data.signInUrl}>Sign in with invited email</a>
        </div>
      </section>
    {/if}

    {#if data.canAccept}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Ready to join?</div>
        <div class="sc-muted-line sc-stack-top-6">
          Accepting will attach your account to this workspace and open the app in that
          workspace context.
        </div>
        <form class="sc-stack-top-10" method="POST" action="?/acceptInvite">
          <button class="sc-btn" type="submit">Accept invite</button>
        </form>
      </section>
    {/if}

    {#if data.inviteStatus === "accepted"}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Invite already accepted.</div>
        <div class="sc-actions sc-stack-top-10">
          <a class="sc-btn" href="/app/processes">Open app</a>
        </div>
      </section>
    {/if}

    {#if data.inviteStatus === "revoked" || data.inviteStatus === "expired"}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Invite unavailable.</div>
        <div class="sc-muted-line sc-stack-top-6">
          This invite has been {data.inviteStatus} and cannot be accepted.
        </div>
      </section>
    {/if}
  {/if}
</div>
