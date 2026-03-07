<script lang="ts">
  import { WebsiteName } from "../../../config"
</script>

<svelte:head>
  <title>Privacy Policy - {WebsiteName}</title>
  <meta name="description" content="Privacy Policy for {WebsiteName}" />
</svelte:head>

<section class="mk-hero mk-hero-tight">
  <span class="mk-eyebrow">Legal</span>
  <h1>Privacy Policy</h1>
  <p>Last updated: March 2, 2026</p>
</section>

<section class="mk-section mk-legal">
  <article>
    <p>
      This Privacy Policy explains what information {WebsiteName} collects, how we
      use it, and the choices you have regarding your data.
    </p>

    <h2>1. Information We Collect</h2>
    <ul>
      <li>
        <strong>Account data:</strong> name, email address, company, and profile
        settings.
      </li>
      <li>
        <strong>Operational content:</strong> data you submit, including roles, processes,
        systems, and workflow notes.
      </li>
      <li>
        <strong>Usage and diagnostics:</strong> device/browser details, request metadata,
        and product usage events.
      </li>
      <li>
        <strong>Billing data:</strong> subscription and payment status metadata from
        payment providers.
      </li>
    </ul>

    <h2>2. How We Use Information</h2>
    <ul>
      <li>Operate and secure the platform.</li>
      <li>Provide customer support and service communications.</li>
      <li>Process subscriptions, invoices, and account administration.</li>
      <li>Improve product quality and reliability.</li>
      <li>Comply with legal obligations and prevent abuse.</li>
    </ul>

    <h2>3. Processors and Third Parties</h2>
    <p>
      We use third-party providers to deliver the service. These may include:
    </p>
    <ul>
      <li><strong>Supabase</strong> (data storage and authentication)</li>
      <li><strong>Stripe</strong> (billing and subscription payments)</li>
      <li><strong>Cloudflare</strong> (hosting and edge delivery)</li>
      <li><strong>Resend</strong> (transactional email delivery)</li>
    </ul>

    <h2>4. Cookies and Similar Technologies</h2>
    <p>
      We use cookies and similar technologies for authentication, session
      continuity, and product performance. You can control cookies through your
      browser settings, though parts of the service may not function without
      them.
    </p>

    <h2>5. Data Retention</h2>
    <p>
      We retain data for as long as needed to provide the service, fulfill
      contractual obligations, resolve disputes, and meet legal requirements.
    </p>

    <h2>6. Data Security</h2>
    <p>
      We apply administrative, technical, and operational safeguards designed to
      protect personal data. No method of transmission or storage is absolutely
      secure.
    </p>

    <h2>7. Your Rights</h2>
    <p>Depending on your location, you may have rights to:</p>
    <ul>
      <li>Access or correct personal information.</li>
      <li>Request deletion of personal information.</li>
      <li>Restrict or object to certain processing activities.</li>
      <li>Request data export where applicable.</li>
    </ul>

    <h2>8. International Transfers</h2>
    <p>
      Your information may be processed in jurisdictions different from your
      own. We take reasonable measures to protect personal information during
      such transfers.
    </p>

    <h2>9. Updates to This Policy</h2>
    <p>
      We may update this policy as our services or legal obligations evolve.
      Updated versions will be posted on this page with a revised effective
      date.
    </p>

    <h2>Contact</h2>
    <p>
      For privacy requests or questions, reach out via our
      <a href="/contact">contact page</a>.
    </p>
  </article>
</section>
