<script lang="ts">
  import { Auth } from "@supabase/auth-ui-svelte"
  import { sharedAppearance, oauthProviders } from "../login_config"
  import { page } from "$app/stores"

  let { data } = $props()

  const resolveNextPath = (): string => {
    const rawNext = $page.url.searchParams.get("next") ?? ""
    if (!rawNext.startsWith("/") || rawNext.startsWith("//")) {
      return "/app/processes"
    }
    return rawNext
  }
</script>

<svelte:head>
  <title>Sign up</title>
</svelte:head>

<h1 class="text-3xl font-serif font-bold mb-6 text-[var(--mk-gold-text)]">
  Sign Up
</h1>
{#if data.authConfigured && data.supabase}
  <Auth
    supabaseClient={data.supabase}
    view="sign_up"
    redirectTo={`${data.url}/auth/callback?next=${encodeURIComponent(resolveNextPath())}`}
    showLinks={false}
    providers={oauthProviders}
    socialLayout="horizontal"
    appearance={sharedAppearance}
    additionalData={undefined}
  />
  <div class="text-l text-[var(--mk-text-secondary)] mt-4 mb-2">
    Have an account? <a class="underline" href="/login/sign_in">Sign in</a>.
  </div>
{:else}
  <div role="alert" class="alert alert-error">
    Auth is not configured. Set `PUBLIC_SUPABASE_URL` and
    `PUBLIC_SUPABASE_ANON_KEY` in Cloudflare.
  </div>
{/if}
