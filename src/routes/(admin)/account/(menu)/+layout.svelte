<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
  }

  let { children }: Props = $props()
</script>

<div class="container px-6 lg:px-12 py-3 lg:py-6">
  {@render children?.()}
</div>

