<script lang="ts">
  import "../../../app.css"
  import { invalidate } from "$app/navigation"
  import { onMount } from "svelte"
  import ScShell from "$lib/components/ScShell.svelte"

  interface Props {
    data: {
      supabase: {
        auth: {
          onAuthStateChange: (
            callback: (
              event: string,
              session: { expires_at?: number } | null,
            ) => void,
          ) => { data: { subscription: { unsubscribe: () => void } } }
        }
      }
      session: { expires_at?: number } | null
      org: {
        id: string
        name: string
        role: "owner" | "admin" | "editor" | "member"
      }
      navCounts: {
        processes: number
        roles: number
        systems: number
        flags: number
      }
      billing?: {
        planId: string
        billingState: "active" | "lapsed"
        isLapsed: boolean
        hasEverPaid: boolean
      }
      workspaceOptions: {
        id: string
        name: string
        role: "owner" | "admin" | "editor" | "member"
      }[]
    }
    children?: import("svelte").Snippet
  }

  let { data, children }: Props = $props()

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

<ScShell {data}>
  {@render children?.()}
</ScShell>
