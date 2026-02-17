<script lang="ts">
  // TODO(LP-008): Legacy starter pricing route retained; content is now SystemsCraft-specific.
  import PricingModule from "./pricing_module.svelte"
  import { WebsiteName } from "./../../../config"
</script>

<svelte:head>
  <title>Pricing</title>
  <meta name="description" content="Pricing - {WebsiteName}" />
</svelte:head>

<div class="min-h-[70vh] pb-20 pt-12 px-4 max-w-6xl mx-auto">
  <div class="text-center mb-16">
    <h1
      class="text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-accent inline-block mb-4"
    >
      Pricing
    </h1>
    <h2 class="text-xl text-slate-400 max-w-2xl mx-auto">
      Choose the plan that fits your workspace size and operating cadence.
    </h2>
  </div>

  <div class="w-full">
    <PricingModule callToAction="Get Started" highlightedPlanId="growth" />

    <div class="mt-32">
      <h3 class="text-3xl font-bold text-center text-white mb-12">
        Frequently Asked Questions
      </h3>
      <div class="flex place-content-center">
        <div
          class="join join-vertical w-full max-w-2xl bg-[#141416] border border-white/5 rounded-xl overflow-hidden shadow-2xl"
        >
          <div
            class="collapse collapse-arrow join-item border-b border-white/5"
          >
            <input type="radio" name="faq-accordion" checked />
            <div
              class="collapse-title text-lg font-semibold text-slate-200 py-5"
            >
              Can we start on Free and upgrade later?
            </div>
            <div class="collapse-content text-slate-400">
              <p class="pb-4">
                Yes. Start on Free, build your atlas, and upgrade when you need
                more collaborators or operational headroom.
              </p>
            </div>
          </div>
          <div
            class="collapse collapse-arrow join-item border-b border-white/5"
          >
            <input type="radio" name="faq-accordion" />
            <div
              class="collapse-title text-lg font-semibold text-slate-200 py-5"
            >
              Is billing tied to our account?
            </div>
            <div class="collapse-content text-slate-400">
              <p class="pb-4">
                Billing and plan management are handled in the account billing
                area through Stripe Checkout and the Stripe Billing Portal.
              </p>
            </div>
          </div>
          <div
            class="collapse collapse-arrow join-item border-b border-white/5"
          >
            <input type="radio" name="faq-accordion" />
            <div
              class="collapse-title text-lg font-semibold text-slate-200 py-5"
            >
              Can we change plans later?
            </div>
            <div class="collapse-content text-slate-400">
              <p class="pb-4">
                Yes. You can change plans from the billing portal at any time.
              </p>
            </div>
          </div>
          <div class="collapse collapse-arrow join-item">
            <input type="radio" name="faq-accordion" />
            <div
              class="collapse-title text-lg font-semibold text-slate-200 py-5"
            >
              Do you support invoicing or enterprise terms?
            </div>
            <div class="collapse-content text-slate-400">
              <p class="pb-4">
                For enterprise billing or procurement requirements, contact us
                via the <a href="/contact" class="text-primary hover:underline"
                  >contact page</a
                >.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
