<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"

  let { data } = $props()
</script>

<svelte:head>
  <title>Account Dashboard</title>
</svelte:head>

<div class="sc-page-head mb-6">
  <div class="sc-page-title text-2xl font-bold">Account Overview</div>
  <div class="sc-page-subtitle">
    Managing your personal profile and workspace access.
  </div>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <section class="sc-card p-6">
    <div class="sc-section-title mb-4">Workspace Membership</div>
    <div class="sc-copy-md mb-4">
      You are currently active in <strong>{data.org.name}</strong>.
    </div>
    <div class="sc-byline">
      <span>Your Role:</span>
      <span class="sc-pill">{data.org.role}</span>
    </div>
    <div class="sc-stack-top-8">
      <a href="/app/workspace" class="sc-btn secondary w-full text-center block">View Workspace</a>
    </div>
  </section>

  <section class="sc-card p-6">
    <div class="sc-section-title mb-4">Atlas Statistics</div>
    <div class="grid grid-cols-2 gap-4">
      <div class="sc-card bg-[var(--sc-bg-inset)] border-none p-3">
        <div class="sc-meta text-xs uppercase opacity-60">Processes</div>
        <div class="text-2xl font-bold">{data.navCounts.processes}</div>
      </div>
      <div class="sc-card bg-[var(--sc-bg-inset)] border-none p-3">
        <div class="sc-meta text-xs uppercase opacity-60">Systems</div>
        <div class="text-2xl font-bold">{data.navCounts.systems}</div>
      </div>
      <div class="sc-card bg-[var(--sc-bg-inset)] border-none p-3">
        <div class="sc-meta text-xs uppercase opacity-60">Roles</div>
        <div class="text-2xl font-bold">{data.navCounts.roles}</div>
      </div>
      <div class="sc-card bg-[var(--sc-bg-inset)] border-none p-3">
        <div class="sc-meta text-xs uppercase opacity-60">Active Flags</div>
        <div class="text-2xl font-bold text-[var(--sc-green)]">{data.navCounts.flags}</div>
      </div>
    </div>
  </section>
</div>

<div class="sc-stack-top-12">
  <section class="sc-card p-6">
    <div class="sc-section-title mb-4">Quick Links</div>
    <div class="flex flex-wrap gap-3">
      <a href="/account/settings" class="sc-btn secondary">Edit Profile</a>
      <a href="/account/billing" class="sc-btn secondary">Manage Billing</a>
      <a href="/account/settings/change_password" class="sc-btn secondary">Security</a>
    </div>
  </section>
</div>
