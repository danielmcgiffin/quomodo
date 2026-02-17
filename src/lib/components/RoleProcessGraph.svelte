<script lang="ts">
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"

  type Props = {
    role: { slug: string; name: string; initials: string }
    actionsByProcess: {
      process: { slug: string; name: string }
      actions: {
        id: string
        sequence: number
        descriptionHtml: string
        system: { slug: string; name: string } | null
      }[]
    }[]
  }

  let { role, actionsByProcess }: Props = $props()
</script>

{#each actionsByProcess as entry}
  {#each entry.actions as action}
    <div class="ac-wrap">
      <div class="ac-inline-seq">{action.sequence}</div>
      <div class="ac-card ac-card--clickable">
        <div class="ac-process-badge">
          <a href="/app/processes/{entry.process.slug}">{entry.process.name}</a>
        </div>
        <div class="ac-body">
          <div class="ac-desc ac-desc--truncated">
            <div class="ac-desc-inner">{@html action.descriptionHtml}</div>
          </div>
          <div class="ac-fork">
            <div class="ac-bracket"></div>
            <div class="ac-tines">
              <div class="ac-tine ac-tine--anchor">
                <span class="ac-tine-wire"></span>
                <span class="ac-tine-anchor-label">
                  <RolePortal {role} size="sm" />
                </span>
              </div>
              {#if action.system}
                <div class="ac-tine ac-tine--portal">
                  <span class="ac-tine-wire"></span>
                  <SystemPortal system={action.system} size="sm" />
                </div>
              {:else}
                <div class="ac-tine ac-tine--portal">
                  <span class="ac-tine-wire"></span>
                  <span class="ac-tine-empty">No system</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/each}
{/each}
