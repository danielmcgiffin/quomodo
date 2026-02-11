<script lang="ts">
  let {
    children,
    delay = 0,
    duration = 600,
    y = 24,
    threshold = 0.15,
    once = true
  }: {
    children: import('svelte').Snippet;
    delay?: number;
    duration?: number;
    y?: number;
    threshold?: number;
    once?: boolean;
  } = $props();

  let el: HTMLDivElement;
  let visible = $state(false);

  $effect(() => {
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      visible = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visible = true;
          if (once) observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={el}
  class="fade-in-wrapper"
  style="opacity:{visible ? 1 : 0};transform:translateY({visible ? 0 : y}px);transition:opacity {duration}ms cubic-bezier(0.16,1,0.3,1) {delay}ms,transform {duration}ms cubic-bezier(0.16,1,0.3,1) {delay}ms;"
>
  {@render children()}
</div>
