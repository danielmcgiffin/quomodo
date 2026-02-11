<script lang="ts">
  import { processes, roleById, systemById, actions } from "$lib/data/atlas"
  import RolePortal from "$lib/components/RolePortal.svelte"
  import SystemPortal from "$lib/components/SystemPortal.svelte"
  import RichText from "$lib/components/RichText.svelte"
</script>

<div class="sc-page">
  <div class="sc-page-title">Processes</div>
  <div class="sc-page-subtitle">
    Every process is an entry point into the atlas.
  </div>

  <div class="sc-section">
    {#each processes as process}
      <div class="sc-card">
        <div class="sc-section-title">
          <a class="sc-portal sc-portal-process" href={`/app/processes/${process.slug}`}>
            {process.name}
          </a>
        </div>
        <div class="sc-page-subtitle">
          <RichText html={process.descriptionHtml} />
        </div>
        <div class="sc-byline" style="margin-top:10px;">
          <RolePortal role={roleById.get(process.ownerRoleId)!} size="sm" />
          <span>· in</span>
          <SystemPortal
            system={systemById.get(
              actions.find((action) => action.processId === process.id)?.systemId ??
                "system-drive",
            )!}
            size="sm"
          />
          <span>·</span>
          <span>{process.trigger}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
