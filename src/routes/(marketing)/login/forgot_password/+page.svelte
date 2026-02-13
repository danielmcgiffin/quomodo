<script lang="ts">
  import { Auth } from "@supabase/auth-ui-svelte"
  import { sharedAppearance, oauthProviders } from "../login_config"

  let { data } = $props()
</script>

<svelte:head>
  <title>Forgot Password</title>
</svelte:head>

<h1 class="text-3xl font-serif font-bold mb-6 text-[var(--mk-gold-text)]">
  Forgot Password
</h1>
{#if data.authConfigured && data.supabase}
  <Auth
    supabaseClient={data.supabase}
    view="forgotten_password"
    redirectTo={`${data.url}/auth/callback?next=%2Faccount%2Fsettings%2Freset_password`}
    providers={oauthProviders}
    socialLayout="horizontal"
    showLinks={false}
    appearance={sharedAppearance}
    additionalData={undefined}
  />
{/if}
<div class="text-l text-[var(--mk-text-secondary)] mt-4">
  Remember your password? <a class="underline" href="/login/sign_in">Sign in</a
  >.
</div>
