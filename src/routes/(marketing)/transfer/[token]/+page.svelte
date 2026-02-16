<script lang="ts">
  import "../../../../app.css"

  type Props = {
    data: {
      transfer: {
        id: string
        orgId: string
        orgName: string
        recipientUserId: string
        fromOwnerUserId: string
        expiresAt: string
      } | null
      transferStatus:
        | "pending"
        | "accepted"
        | "cancelled"
        | "expired"
        | "invalid"
      signInUrl: string
      canAccept: boolean
      userAuthenticated: boolean
      userId: string | null
      userMatchesRecipient: boolean
    }
    form?: {
      acceptTransferError?: string
    }
  }

  let { data, form }: Props = $props()
</script>

<div class="sc-page">
  <div class="sc-page-head">
    <div class="flex flex-col">
      <div class="sc-page-title text-2xl font-bold">Ownership transfer</div>
      <div class="sc-page-subtitle">
        Accept ownership of a SystemsCraft workspace.
      </div>
    </div>
  </div>

  {#if form?.acceptTransferError}
    <div class="sc-card sc-stack-top-12">
      <div class="sc-form-error">{form.acceptTransferError}</div>
    </div>
  {/if}

  {#if !data.transfer}
    <section class="sc-card sc-stack-top-12">
      <div class="font-semibold">Transfer not found.</div>
      <div class="sc-muted-line sc-stack-top-6">
        This link is invalid or no longer available.
      </div>
    </section>
  {:else}
    <section class="sc-card sc-stack-top-12">
      <div class="font-semibold">{data.transfer.orgName}</div>
      <div class="sc-muted-line sc-stack-top-6">
        Transfer status: {data.transferStatus}
      </div>
    </section>

    {#if data.transferStatus === "pending" && !data.userAuthenticated}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Sign in to accept this transfer.</div>
        <div class="sc-actions sc-stack-top-10">
          <a class="sc-btn" href={data.signInUrl}>Sign in</a>
        </div>
      </section>
    {/if}

    {#if data.transferStatus === "pending" && data.userAuthenticated && !data.userMatchesRecipient}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Wrong account signed in.</div>
        <div class="sc-muted-line sc-stack-top-6">
          This transfer can only be accepted by the intended recipient.
        </div>
        <div class="sc-actions sc-stack-top-10">
          <a class="sc-btn secondary" href="/account/sign_out">Sign out</a>
          <a class="sc-btn" href={data.signInUrl}
            >Sign in with the recipient account</a
          >
        </div>
      </section>
    {/if}

    {#if data.canAccept}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Ready to accept?</div>
        <div class="sc-muted-line sc-stack-top-6">
          Accepting will make you the workspace owner and open the app in that
          workspace context.
        </div>
        <form
          class="sc-stack-top-10"
          method="POST"
          action="?/acceptOwnershipTransfer"
        >
          <button class="sc-btn" type="submit">Accept transfer</button>
        </form>
      </section>
    {/if}

    {#if data.transferStatus === "accepted"}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Transfer already accepted.</div>
        <div class="sc-actions sc-stack-top-10">
          <a class="sc-btn" href="/app/team?ownershipTransferAccepted=1"
            >Open team settings</a
          >
        </div>
      </section>
    {/if}

    {#if data.transferStatus === "cancelled" || data.transferStatus === "expired"}
      <section class="sc-card sc-stack-top-12">
        <div class="font-semibold">Transfer unavailable.</div>
        <div class="sc-muted-line sc-stack-top-6">
          This transfer has been {data.transferStatus} and cannot be accepted.
        </div>
      </section>
    {/if}
  {/if}
</div>
