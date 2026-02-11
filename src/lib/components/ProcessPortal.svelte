<script lang="ts">
  import type { Process } from "$lib/data/atlas"

  export let process: Process
  export let showName = true
</script>

<a class="sc-portal sc-portal-process" href={`/app/processes/${process.slug}`}>
  {#if showName}
    <span class="sc-portal-name">{process.name}</span>
  {/if}
</a>
