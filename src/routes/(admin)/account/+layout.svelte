<script lang="ts">
  // TODO(LP-008): Retained legacy account auth shell. Keep for session/billing flows until replaced by dedicated SystemsCraft account UX.
  import { invalidate } from "$app/navigation"
  import { onMount } from "svelte"

  let { data, children } = $props()

  onMount(() => {
    const { data: authData } = data.supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (nextSession?.expires_at !== data.session?.expires_at) {
          invalidate("supabase:auth")
        }
      },
    )

    return () => authData.subscription.unsubscribe()
  })
</script>

{@render children?.()}
