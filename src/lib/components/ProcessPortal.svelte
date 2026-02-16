<script lang="ts">
  type ProcessPortalModel = {
    slug: string
    name: string
  }

  let {
    process,
    showName = true,
    query = "",
  }: {
    process: ProcessPortalModel
    showName?: boolean
    query?: string
    size?: "sm" | "md" | "lg"
  } = $props()

  const href = $derived.by(() => {
    if (!query) {
      return `/app/processes/${process.slug}`
    }
    if (query.startsWith("?")) {
      return `/app/processes/${process.slug}${query}`
    }
    return `/app/processes/${process.slug}?${query}`
  })
</script>

<a class="sc-portal sc-portal-process" {href}>
  {#if showName}
    <span class="sc-portal-name">{process.name}</span>
  {/if}
</a>
