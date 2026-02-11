<script lang="ts">
  let { html = "" } = $props()

  const decodeHtml = (value: string): string =>
    value
      .replaceAll("&nbsp;", " ")
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&#39;", "'")
      .replaceAll("&quot;", '"')

  const toParagraphs = (value: string): string[] => {
    const asText = decodeHtml(
      value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>\s*<p>/gi, "\n\n")
        .replace(/<[^>]+>/g, ""),
    )
      .split(/\n{2,}/)
      .map((line) => line.trim())
      .filter(Boolean)

    return asText.length > 0 ? asText : [""]
  }

  const paragraphs = $derived(toParagraphs(html))
</script>

<div class="sc-rich">
  {#each paragraphs as paragraph}
    <p>{paragraph}</p>
  {/each}
</div>
