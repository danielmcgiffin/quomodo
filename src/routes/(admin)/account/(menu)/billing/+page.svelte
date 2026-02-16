<script lang="ts">
  import SettingsModule from "../settings/settings_module.svelte"
  import PricingModule from "../../../../(marketing)/pricing/pricing_module.svelte"
  import {
    pricingPlans,
    defaultPlanId,
  } from "../../../../(marketing)/pricing/pricing_plans"

  let { data } = $props()

  const currentPlanId = $derived(data.currentPlanId ?? defaultPlanId)
  const currentPlanName = $derived(
    pricingPlans.find((x) => x.id === data.currentPlanId)?.name,
  )
</script>

<svelte:head>
  <title>Billing</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-2">
  {data.billing?.isLapsed
    ? "Billing (Lapsed)"
    : data.isActiveCustomer
      ? "Billing"
      : "Select a Plan"}
</h1>
<div>
  View our <a href="/pricing" target="_blank" class="link">pricing page</a> for details.
</div>

{#if data.billing?.isLapsed}
  <div class="mt-4">
    This workspace is in read-only mode because billing has lapsed. Only the
    workspace owner can reactivate billing.
  </div>
{/if}

{#if !data.isActiveCustomer}
  {#if data.canManageBilling}
    <div class="mt-8">
      <PricingModule
        {currentPlanId}
        callToAction={data.billing?.isLapsed ? "Reactivate" : "Select Plan"}
        center={false}
      />
    </div>
  {:else}
    <div class="mt-8">
      Only the workspace owner can manage billing for this workspace.
    </div>
  {/if}

  {#if data.hasEverHadSubscription && data.canManageBilling}
    <div class="mt-10">
      <a href="/account/billing/manage" class="link">View past invoices</a>
    </div>
  {/if}
{:else}
  <SettingsModule
    title="Subscription"
    editable={false}
    fields={[
      {
        id: "plan",
        label: "Current Plan",
        initialValue: currentPlanName || "",
      },
    ]}
    editButtonTitle={data.canManageBilling
      ? "Manage Subscription"
      : "Billing Owner Only"}
    editLink={data.canManageBilling ? "/account/billing/manage" : undefined}
  />
{/if}
