<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import ProcessPortal from "$lib/components/ProcessPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"

  let { data, form } = $props()
</script>

<div class="sc-page">
  <div class="sc-page-title">{data.process.name}</div>
  <div class="sc-page-subtitle">
    <RichText html={data.process.descriptionHtml} />
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Process Details</div>
    <div class="sc-card">
      <div class="sc-byline">
        <span>Trigger: {data.process.trigger}</span>
        <span>·</span>
        <span>End State: {data.process.endState}</span>
        <span>·</span>
        <span>Actions ({data.actions.length})</span>
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Who's Involved?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.roles as role}
          <RolePortal {role} />
        {/each}
      </div>
    </div>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">What Systems?</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.systems as system}
          <SystemPortal {system} />
        {/each}
      </div>
    </div>
  </div>

  {#if data.processFlags.length}
    <div class="sc-section">
      <div class="sc-section-title">What's Broken?</div>
      {#each data.processFlags as flag}
        <div class="sc-card sc-card-flag">
          <div class="sc-flag-banner">⚑ {flag.flagType.replace("_", " ")}</div>
          <div style="margin-top:10px;">{flag.message}</div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="sc-section">
    <div class="sc-section-title">What Happens?</div>
    {#each data.actions as action}
      <div class="sc-card">
        <div class="sc-meta">Action {action.sequence}</div>
        <div
          style="font-size: var(--sc-font-lg); font-weight: 600; margin-top:6px;"
        >
          <RichText html={action.descriptionHtml} />
        </div>
        <div class="sc-byline" style="margin-top:10px;">
          {#if action.ownerRole}
            <RolePortal
              role={action.ownerRole as {
                slug: string
                name: string
                initials: string
              }}
            />
          {/if}
          {#if action.system}
            <span>· in</span>
            <SystemPortal
              system={action.system as { slug: string; name: string }}
            />
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Add Action</div>
    <form class="sc-card" method="POST" action="?/createAction">
      {#if form?.createActionError}
        <div style="color: var(--sc-danger); margin-bottom: 10px;">
          {form.createActionError}
        </div>
      {/if}
      <div class="sc-byline" style="margin-bottom:10px;">
        <input
          class="sc-search"
          name="sequence"
          placeholder="Sequence (optional)"
        />
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <select class="sc-search" name="owner_role_id" required>
          <option value="">Role responsible</option>
          {#each data.allRoles as role}
            <option value={role.id}>{role.name}</option>
          {/each}
        </select>
        <select class="sc-search" name="system_id" required>
          <option value="">System</option>
          {#each data.allSystems as system}
            <option value={system.id}>{system.name}</option>
          {/each}
        </select>
      </div>
      <div class="sc-byline" style="margin-bottom:10px;">
        <textarea
          class="sc-search"
          name="description"
          placeholder="Action description"
          rows="3"
          required
        ></textarea>
      </div>
      <button class="sc-btn" type="submit">Create Action</button>
    </form>
  </div>

  <div class="sc-section">
    <div class="sc-section-title">Create Flag</div>
    <form class="sc-card" method="POST" action="?/createProcessFlag">
      {#if form?.createProcessFlagError}
        <div style="color: var(--sc-danger); margin-bottom: 10px;">
          {form.createProcessFlagError}
        </div>
      {/if}
      <div class="sc-byline" style="margin-bottom:10px;">
        <select class="sc-search" name="flag_type">
          <option value="comment">comment</option>
          <option value="question">question</option>
          <option value="needs_review">needs_review</option>
          <option value="stale">stale</option>
          <option value="incorrect">incorrect</option>
        </select>
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
    <div class="sc-section-title">Traverse</div>
    <div class="sc-card">
      <div class="sc-byline">
        {#each data.roles as role}
          <RolePortal {role} />
        {/each}
        <span>·</span>
        {#each data.systems as system}
          <SystemPortal {system} />
        {/each}
        <span>·</span>
        <ProcessPortal process={data.process} />
      </div>
    </div>
  </div>
</div>
