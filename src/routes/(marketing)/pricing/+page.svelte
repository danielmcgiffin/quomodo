<script lang="ts">
  // TODO(LP-008): Legacy starter pricing route retained; content is now SystemsCraft-specific.
  import PricingModule from "./pricing_module.svelte"
  import { WebsiteName } from "./../../../config"
</script>

<svelte:head>
  <title>Pricing</title>
  <meta name="description" content="Pricing - {WebsiteName}" />
</svelte:head>

<div class="min-h-[70vh] pb-8 pt-[5vh] px-4">
  <h1 class="text-3xl font-bold text-center">Pricing</h1>
  <h2 class="text-xl text-center text-slate-500 mt-1 pb-3">
    Choose the plan that fits your workspace size and operating cadence.
  </h2>

  <div class="w-full my-8">
    <PricingModule callToAction="Get Started" highlightedPlanId="growth" />
    <h1 class="text-2xl font-bold text-center mt-24">Pricing FAQ</h1>
    <div class="flex place-content-center">
      <div class="join join-vertical max-w-xl py-6 mx-auto">
        <div class="collapse collapse-arrow join-item border border-primary">
          <input type="radio" name="faq-accordion" />
          <div class="collapse-title text-lg font-medium">
            Can we start on Free and upgrade later?
          </div>
          <div class="collapse-content">
            <p>
              Yes. Start on Free, build your atlas, and upgrade when you need
              more collaborators or operational headroom.
            </p>
          </div>
        </div>
        <div class="collapse collapse-arrow join-item border border-primary">
          <input type="radio" name="faq-accordion" />
          <div class="collapse-title text-lg font-medium">
            Is billing tied to our account?
          </div>
          <div class="collapse-content">
            <p>
              Billing and plan management are handled in the account billing
              area through Stripe Checkout and the Stripe Billing Portal.
            </p>
          </div>
        </div>
        <div class="collapse collapse-arrow join-item border border-primary">
          <input type="radio" name="faq-accordion" />
          <div class="collapse-title text-lg font-medium">
            Can we change plans later?
          </div>
          <div class="collapse-content">
            <p>
              Yes. You can change plans from the billing portal at any time.
            </p>
          </div>
        </div>
        <div class="collapse collapse-arrow join-item border border-primary">
          <input type="radio" name="faq-accordion" />
          <div class="collapse-title text-lg font-medium">
            Do you support invoicing or enterprise terms?
          </div>
          <div class="collapse-content">
            <p>
              For enterprise billing or procurement requirements, contact us via
              the <a href="/contact" class="link">contact page</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
