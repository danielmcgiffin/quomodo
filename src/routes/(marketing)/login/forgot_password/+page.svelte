<script lang="ts">
  import { Auth } from "@supabase/auth-ui-svelte"
  import { sharedAppearance, oauthProviders } from "../login_config"
  import { onMount } from "svelte"

  let { data } = $props()

  onMount(() => {
    // SR16-011: Clear focus before Supabase Auth UI mounts to prevent "Autofocus processing was blocked" warnings.
    if (
      typeof document !== "undefined" &&
      document.activeElement instanceof HTMLElement
    ) {
      document.activeElement.blur()
    }
  })
</script>

<svelte:head>
  <title>Forgot Password</title>
</svelte:head>

<h1 class="mk-auth-title">Forgot password</h1>
{#if data.authConfigured && data.supabase}
  <Auth
    supabaseClient={data.supabase}
    view="forgotten_password"
    redirectTo={`${data.authBaseUrl}/auth/callback?next=%2Faccount%2Fsettings%2Freset_password`}
    providers={oauthProviders}
    socialLayout="horizontal"
    showLinks={false}
    appearance={sharedAppearance}
    additionalData={undefined}
  />
{/if}
<div class="mk-auth-link-row mt-4">
  Remember your password? <a href={`${data.basePath}/login/sign_in`}>Sign in</a>.
</div>
