<script lang="ts">
  import "../../app.css"
  import ScShell from "$lib/components/ScShell.svelte"

  interface Props {
    data: {
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
      billing: {
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
</script>

<ScShell {data}>
  {@render children?.()}
</ScShell>
