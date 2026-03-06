<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()
  let isEurope = $state(false)

  try {
    isEurope = Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone.startsWith("Europe/")
  } catch {
    isEurope = false
  }
</script>

<section class="mk-auth-shell">
  <div class="mk-auth-panel">
    {@render children?.()}
    {#if isEurope}
      <p class="mk-auth-cookie-note">
        Cookie-based sessions are required for sign-in.
      </p>
    {/if}
  </div>
</section>
