<script lang="ts">
  type ProcessPortalModel = {
    slug: string
    name: string
  }

  export let process: ProcessPortalModel
  export let showName = true
</script>

<a class="sc-portal sc-portal-process" href={`/app/processes/${process.slug}`}>
  {#if showName}
    <span class="sc-portal-name">{process.name}</span>
  {/if}
</a>
