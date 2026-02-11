<script lang="ts">
  type ProcessPortalModel = {
    slug: string
    name: string
  }

  let {
    process,
    showName = true,
  }: {
    process: ProcessPortalModel
    showName?: boolean
  } = $props()
</script>

<a class="sc-portal sc-portal-process" href={`/app/processes/${process.slug}`}>
  {#if showName}
    <span class="sc-portal-name">{process.name}</span>
  {/if}
</a>
