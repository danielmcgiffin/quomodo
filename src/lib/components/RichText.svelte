<script lang="ts">
  let { html = "" }: { html?: string } = $props()
</script>

<div class="sc-rich">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html html}
</div>
