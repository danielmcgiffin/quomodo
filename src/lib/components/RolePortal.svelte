<script lang="ts">
  import type { Role } from "$lib/data/atlas"

  export let role: Role
  export let size: "sm" | "md" | "base" | "lg" = "md"
  export let showName = true

  const sizeMap = {
    sm: { size: 22, font: 9 },
    md: { size: 28, font: 11 },
    base: { size: 32, font: 12 },
    lg: { size: 36, font: 14 },
  }
</script>

<a class="sc-portal sc-portal-role" href={`/app/roles/${role.slug}`}>
  <span
    class="sc-avatar"
    style={`--avatar-size:${sizeMap[size].size}px;--avatar-font:${sizeMap[size].font}px;`}
    >{role.initials}</span
  >
  {#if showName}
    <span class="sc-portal-name">{role.name}</span>
  {/if}
</a>
