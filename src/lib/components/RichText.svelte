<script lang="ts">
  let { html = "" }: { html?: string } = $props()
</script>

<div class="sc-rich">
  {@html html}
</div>

