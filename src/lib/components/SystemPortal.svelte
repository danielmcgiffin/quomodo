<script lang="ts">
  type SystemPortalModel = {
    slug: string
    name: string
  }

  let {
    system,
    size = "md",
    showName = true,
  }: {
    system: SystemPortalModel
    size?: "sm" | "md" | "base" | "lg"
    showName?: boolean
  } = $props()

  const sizeMap = {
    sm: 22,
    md: 28,
    base: 32,
    lg: 36,
  }
</script>

<a class="sc-portal sc-portal-system" href={`/app/systems/${system.slug}`}>
  <span class="sc-system" style={`--system-size:${sizeMap[size]}px;`}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <polygon
        points="50,6 92,29 92,71 50,94 8,71 8,29"
        fill="none"
        stroke="currentColor"
        stroke-width="8"
      />
    </svg>
  </span>
  {#if showName}
    <span class="sc-portal-name">{system.name}</span>
  {/if}
</a>
