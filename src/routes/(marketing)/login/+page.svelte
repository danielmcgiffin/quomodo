<script lang="ts">
  import { goto } from "$app/navigation"

  let { data } = $props()

  const navigateInternal = (event: MouseEvent, href: string): void => {
    event.preventDefault()
    goto(`${data.basePath}${href}`)
  }
</script>

<svelte:head>
  <title>Log In</title>
</svelte:head>

<div>
  <h1 class="mk-auth-title">Get Started</h1>
  <a
    href={`${data.basePath}/login/sign_up`}
    class="mk-btn mk-btn-primary w-full mt-3"
    onclick={(event) => navigateInternal(event, "/login/sign_up")}>Sign up</a
  >

  <h2 class="mk-auth-subtitle">Already have an account?</h2>
  <a
    href={`${data.basePath}/login/sign_in`}
    class="mk-btn mk-btn-quiet w-full mt-3"
    onclick={(event) => navigateInternal(event, "/login/sign_in")}>Sign in</a
  >
</div>
