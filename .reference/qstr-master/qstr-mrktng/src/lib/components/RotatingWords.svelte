<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  export let words: string[] = [];
  export let intervalMs = 2400;
  export let animMs = 380;

  let cur = 0;
  let next = 1;
  let animating = false;

  let reducedMotion = false;
  let intervalTimer: number | undefined;
  let timeoutTimer: number | undefined;

  const longest = () => words.reduce((a, b) => (a.length > b.length ? a : b), words[0] ?? "");

  function tick() {
    if (words.length <= 1 || animating) return;
    animating = true;
    next = (cur + 1) % words.length;

    timeoutTimer = window.setTimeout(() => {
      cur = next;
      animating = false;
    }, animMs);
  }

  onMount(() => {
    reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (!reducedMotion && words.length > 1) intervalTimer = window.setInterval(tick, intervalMs);
  });

  onDestroy(() => {
    if (intervalTimer) window.clearInterval(intervalTimer);
    if (timeoutTimer) window.clearTimeout(timeoutTimer);
  });
</script>

<span class="rw" style={`--anim:${animMs}ms;`}>
  <!-- reserves width so 'No more' never moves -->
  <span class="rw-reserve">{longest()}</span>

  <span class="rw-stack">
    <span class="rw-word rw-current" class:out={animating}>{words[cur] ?? ""}</span>
    {#if animating}
      <span class="rw-word rw-next in">{words[next] ?? ""}</span>
    {/if}
  </span>
</span>

<style>
  .rw {
    display: inline-grid;
    vertical-align: baseline;
    white-space: nowrap;
  }

  .rw-reserve {
    grid-area: 1 / 1;
    visibility: hidden;
    white-space: nowrap;
  }

  .rw-stack {
    grid-area: 1 / 1;
    position: relative;
    display: inline-block;
    white-space: nowrap;
  }

  .rw-word {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translate3d(0, -50%, 0);
    opacity: 1;

    will-change: transform, opacity;
    backface-visibility: hidden;
    transform-style: preserve-3d;

    color: rgb(var(--accent));
  }

  /* current: visible, then animate out DOWN */
  .rw-current.out {
    opacity: 0;
    transform: translate3d(0, calc(-50% + 30px), 0);
    transition: transform var(--anim) cubic-bezier(0.16, 1, 0.3, 1),
      opacity var(--anim) cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* next: start ABOVE + invisible, then animate to center */
  .rw-next.in {
    opacity: 0;
    transform: translate3d(0, calc(-50% - 30px), 0);
    animation: rw-in var(--anim) cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes rw-in {
    to {
      opacity: 1;
      transform: translate3d(0, -50%, 0);
    }
  }
</style>