<script lang="ts">
  import { WebsiteName } from "../../../config"
</script>

<svelte:head>
  <title>Terms of Service - {WebsiteName}</title>
  <meta name="description" content="Terms of Service for {WebsiteName}" />
</svelte:head>

<div class="mk-hero mk-hero-tight">
  <span class="mk-eyebrow">Legal</span>
  <h1>Terms of Service</h1>
  <p>Last updated: February 14, 2026</p>
</div>

<div class="mk-section">
  <article
    class="prose prose-invert max-w-none font-sans
    prose-headings:font-serif prose-headings:text-[var(--mk-gold-text)]
    prose-p:text-[var(--mk-text-secondary)]
    prose-li:text-[var(--mk-text-secondary)]
    prose-strong:text-[var(--mk-text)]
    prose-a:text-[var(--mk-gold-text)] hover:prose-a:text-[var(--mk-gold)]"
  >
    <p>
      Welcome to {WebsiteName}. These Terms of Service ("Terms") govern your
      access to and use of {WebsiteName}'s website and services. By using our
      services, you agree to be bound by these Terms.
    </p>

    <h2>1. Acceptance of Terms</h2>
    <p>
      By accessing or using {WebsiteName}, you agree to comply with and be
      legally bound by these Terms, whether or not you become a registered user
      of the Services. These Terms govern your access to and use of the Services
      and constitute a binding legal agreement between you and {WebsiteName}.
    </p>

    <h2>2. Description of Service</h2>
    <p>
      {WebsiteName} provides an operational atlas for SMB teams to map roles, processes,
      and systems. We reserve the right to modify or discontinue, temporarily or
      permanently, the Service (or any part thereof) with or without notice.
    </p>

    <h2>3. User Accounts</h2>
    <p>
      To use certain features of the Service, you must register for an account.
      You agree to:
    </p>
    <ul>
      <li>Provide accurate, current, and complete information.</li>
      <li>
        Maintain the security of your password and accept all risks of
        unauthorized access to your account.
      </li>
      <li>
        Promptly notify us if you discover or otherwise suspect any security
        breaches related to the Service.
      </li>
    </ul>

    <h2>4. Fees and Payment</h2>
    <p>
      Certain aspects of the Service may be provided for a fee. You agree to pay
      all fees and charges specified in your selected plan. All fees are
      non-refundable except as required by law. We use Stripe for payment
      processing.
    </p>

    <h2>5. Content and Intellectual Property</h2>
    <p>
      You retain all rights in, and are solely responsible for, the User Content
      you post to {WebsiteName}. However, by posting User Content, you grant
      {WebsiteName} a worldwide, non-exclusive, royalty-free license to use, copy,
      reproduce, process, adapt, modify, publish, transmit, display and distribute
      such Content in connection with providing the Service.
    </p>

    <h2>6. Prohibited Conduct</h2>
    <p>
      You agree not to engage in any of the following prohibited activities:
    </p>
    <ul>
      <li>
        Copying, distributing, or disclosing any part of the Service in any
        medium.
      </li>
      <li>Using any automated system to access the Service.</li>
      <li>
        Attempting to interfere with, compromise the system integrity or
        security or decipher any transmissions to or from the servers running
        the Service.
      </li>
      <li>
        Taking any action that imposes, or may impose at our sole discretion an
        unreasonable or disproportionately large load on our infrastructure.
      </li>
    </ul>

    <h2>7. Termination</h2>
    <p>
      We may terminate or suspend your account and bar access to the Service
      immediately, without prior notice or liability, under our sole discretion,
      for any reason whatsoever and without limitation, including but not
      limited to a breach of the Terms.
    </p>

    <h2>8. Limitation of Liability</h2>
    <p>
      In no event shall {WebsiteName}, nor its directors, employees, partners,
      agents, suppliers, or affiliates, be liable for any indirect, incidental,
      special, consequential or punitive damages, including without limitation,
      loss of profits, data, use, goodwill, or other intangible losses,
      resulting from your access to or use of or inability to access or use the
      Service.
    </p>

    <h2>9. Governing Law</h2>
    <p>
      These Terms shall be governed and construed in accordance with the laws of
      the jurisdiction in which the company is registered, without regard to its
      conflict of law provisions.
    </p>

    <h2>10. Changes to Terms</h2>
    <p>
      We reserve the right, at our sole discretion, to modify or replace these
      Terms at any time. We will provide notice of any changes by posting the
      new Terms on this page.
    </p>

    <h2>Contact Us</h2>
    <p>
      If you have any questions about these Terms, please contact us at via our
      <a href="/contact" class="link">contact page</a>.
    </p>
  </article>
</div>
