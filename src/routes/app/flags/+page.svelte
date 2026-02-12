<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"

  type FlagEntry =
    | {
        id: string
        targetType: "process"
        targetPath: string | null
        flagType: string
        message: string
        createdAt: string
        status: string
        target: { slug: string; name: string } | null
      }
    | {
        id: string
        targetType: "system"
        targetPath: string | null
        flagType: string
        message: string
        createdAt: string
        status: string
        target: { slug: string; name: string } | null
      }
    | {
        id: string
        targetType: "role"
        targetPath: string | null
        flagType: string
        message: string
        createdAt: string
        status: string
        target: { slug: string; name: string; initials: string } | null
      }
    | {
        id: string
        targetType: "action"
        targetPath: string | null
        flagType: string
        message: string
        createdAt: string
        status: string
        target: { label: string } | null
      }
  type Props = {
    data: {
      viewerRole: "owner" | "admin" | "editor" | "member"
      targetOptions: { value: string; label: string }[]
      flags: FlagEntry[]
    }
    form?: { createFlagError?: string }
  }

  let { data, form }: Props = $props()

  const canModerate = $derived.by(() =>
    ["owner", "admin", "editor"].includes(data.viewerRole),
  )
</script>

<div class="sc-page">
  <div class="sc-page-title">Flags</div>
  <div class="sc-page-subtitle">
    Maintenance dashboard for rot across the atlas.
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Create Flag</div>
    <form class="sc-card" method="POST" action="?/createFlag">
      {#if form?.createFlagError}
        <div style="color: var(--sc-danger); margin-bottom: 10px;">
          {form.createFlagError}
        </div>
      {/if}
      <div class="sc-byline" style="margin-bottom:10px;">
        <select class="sc-search" name="target" required>
          <option value="">Target entity</option>
          {#each data.targetOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        <select class="sc-search" name="flag_type">
          <option value="comment">comment</option>
          <option value="question">question</option>
          <option value="needs_review">needs_review</option>
          <option value="stale">stale</option>
          <option value="incorrect">incorrect</option>
        </select>
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <input
          class="sc-search"
          name="target_path"
          placeholder="Target path (optional)"
        />
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <textarea
          class="sc-search"
          name="message"
          placeholder="Flag message"
          rows="3"
          required
        ></textarea>
      </div>
      <button class="sc-btn" type="submit">Create Flag</button>
    </form>
  </div>

  <div class="sc-section">
    {#each data.flags as flag}
      <div class="sc-card sc-card-flag">
        <div class="sc-byline">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          <span class="sc-pill">Flagged {flag.createdAt}</span>
          <span class="sc-pill">Status: {flag.status}</span>
        </div>
        <div style="margin-top:12px; font-size: var(--sc-font-md);">
          {flag.message}
        </div>
        <div class="sc-byline" style="margin-top:12px;">
          <span>Target</span>
          {#if flag.targetType === "process" && flag.target}
            <ProcessPortal
              process={flag.target as { slug: string; name: string }}
            />
          {:else if flag.targetType === "system" && flag.target}
            <SystemPortal
              system={flag.target as { slug: string; name: string }}
            />
          {:else if flag.targetType === "role" && flag.target}
            <RolePortal role={flag.target} />
          {:else if flag.targetType === "action" && flag.target}
            <span>{(flag.target as { label: string }).label}</span>
          {/if}
          {#if flag.targetPath}
            <span>·</span>
            <span>Path: {flag.targetPath}</span>
          {/if}
        </div>
        {#if canModerate}
          <div class="sc-actions" style="margin-top:12px;">
            <form method="POST" action="?/resolveFlag">
              <input type="hidden" name="id" value={flag.id} />
              <button class="sc-btn" type="submit">Resolve</button>
            </form>
            <form method="POST" action="?/dismissFlag">
              <input type="hidden" name="id" value={flag.id} />
              <button class="sc-btn secondary" type="submit">Dismiss</button>
            </form>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
