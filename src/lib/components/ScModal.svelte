<script lang="ts">
  let {
    open = $bindable(false),
    title,
    description = "",
    maxWidth = "680px",
  }: {
    open?: boolean
    title: string
    description?: string
    maxWidth?: string
  } = $props()

  const close = () => {
    open = false
  }

  const onBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      close()
    }
  }

  const onBackdropKeydown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) {
      return
    }

    if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
      event.preventDefault()
      close()
    }
  }

  const onWindowKeydown = (event: KeyboardEvent) => {
    if (open && event.key === "Escape") {
      event.preventDefault()
      close()
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
  <div
    class="sc-modal-backdrop"
    role="button"
    tabindex="0"
    aria-label="Close dialog"
    onclick={onBackdropClick}
    onkeydown={onBackdropKeydown}
  >
    <div
      class="sc-modal-shell"
      style={`--sc-modal-max-width: ${maxWidth};`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div class="sc-modal-header">
        <div>
          <div class="sc-section-title">{title}</div>
          {#if description}
            <div class="sc-page-subtitle">{description}</div>
          {/if}
        </div>
        <button
          class="sc-btn secondary sc-modal-close"
          type="button"
          onclick={close}
        >
          Close
        </button>
      </div>
      <div class="sc-modal-body">
        <slot />
      </div>
    </div>
  </div>
{/if}
