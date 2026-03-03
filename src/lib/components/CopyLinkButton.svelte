<script lang="ts">
  import { Link } from "lucide-svelte"

  type Props = {
    href: string
    label?: string
    variant?: "button" | "icon"
    className?: string
  }

  let {
    href,
    label = "Copy link",
    variant = "button",
    className = "",
  }: Props = $props()
  let copied = $state(false)
  let timeoutRef: ReturnType<typeof setTimeout> | null = null

  const clearCopiedState = () => {
    copied = false
    if (timeoutRef) {
      clearTimeout(timeoutRef)
      timeoutRef = null
    }
  }

  const getAbsoluteUrl = () => {
    if (typeof window === "undefined") {
      return href
    }
    return new URL(href, window.location.origin).toString()
  }

  const copyText = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
    const input = document.createElement("textarea")
    input.value = text
    input.setAttribute("readonly", "")
    input.style.position = "absolute"
    input.style.left = "-9999px"
    document.body.appendChild(input)
    input.select()
    document.execCommand("copy")
    document.body.removeChild(input)
  }

  const handleCopy = async () => {
    try {
      await copyText(getAbsoluteUrl())
      copied = true
      if (timeoutRef) {
        clearTimeout(timeoutRef)
      }
      timeoutRef = setTimeout(() => {
        copied = false
        timeoutRef = null
      }, 1400)
    } catch {
      clearCopiedState()
    }
  }
</script>

<span class="sc-copy-link-wrap">
  <button
    class={variant === "icon"
      ? `sc-inline-link-icon ${className}`.trim()
      : `sc-btn secondary ${className}`.trim()}
    type="button"
    onclick={handleCopy}
    title={copied ? "Link copied" : label}
    aria-label={copied ? "Link copied" : label}
  >
    {#if variant === "icon"}
      <Link size={16} strokeWidth={1.75} aria-hidden="true" />
    {:else}
      {copied ? "Link copied" : label}
    {/if}
  </button>
  {#if copied && variant === "icon"}
    <span class="sc-copy-link-tooltip" role="status" aria-live="polite">
      Link copied
    </span>
  {/if}
</span>

<style>
  .sc-copy-link-wrap {
    position: relative;
    display: inline-flex;
  }

  .sc-copy-link-tooltip {
    position: absolute;
    right: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
    background: var(--sc-text);
    color: var(--sc-bg);
    border-radius: 999px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    pointer-events: none;
  }
</style>
