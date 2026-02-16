<svelte:head>
  <title>Current Password Incorrect</title>
</svelte:head>

<h1 class="text-3xl font-serif font-bold mb-6 text-[var(--mk-gold-text)]">
  Current Password Incorrect
</h1>

<p class="text-[var(--mk-text-secondary)]">
  You attempted to update your account with an incorrect current password, and have
  been logged out for security.
</p>
<p class="mt-6 text-[var(--mk-text-secondary)]">
  If you know your password, please <a
    href="/login/sign_in"
    class="underline text-[var(--mk-gold-text)]">sign in</a
  > and try again.
</p>
<p class="mt-6 text-[var(--mk-text-secondary)]">
  If you have forgotten your password, you can <a
    href="/login/forgot_password"
    class="underline text-[var(--mk-gold-text)]">reset it here</a
  >.
</p>
