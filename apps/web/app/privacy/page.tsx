// SR-10: Privacy policy. SSR — no 'use client'.
// Required before any data collection.
// Linked from: disclaimer checkbox, email capture, site footer.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — nosurcharging.com.au',
  description: 'How nosurcharging.com.au collects, uses, and protects your data.',
};

const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? 'privacy@nosurcharging.com.au';
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@nosurcharging.com.au';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-background-primary)' }}>
      {/* Site-wide disclaimer */}
      <div
        className="py-2 text-center"
        style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}
      >
        <p className="text-micro" style={{ color: 'var(--color-text-tertiary)' }}>
          nosurcharging.com.au provides general guidance only. Not financial advice.
          Verify with your PSP before making business decisions.
        </p>
      </div>

      <div className="mx-auto max-w-content px-5 py-8">
        <h1
          className="font-serif font-medium"
          style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}
        >
          Privacy Policy
        </h1>

        <div className="mt-6 space-y-6" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65' }}>
          {/* a. What we collect */}
          <section>
            <h2
              className="font-serif font-medium"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              What we collect
            </h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-body-sm">
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Session data:</strong>{' '}
                An anonymous UUID stored as an HttpOnly cookie. This identifies your assessment
                session. It is not linked to your identity.
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Assessment inputs:</strong>{' '}
                Volume, plan type, PSP, industry, and surcharging status. Stored in our database
                to generate your P&L calculation and personalised action list.
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Email address:</strong>{' '}
                Only if you sign up for the October benchmarking alert. Encrypted at rest using
                pgcrypto. Never stored in plain text.
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>IP address:</strong>{' '}
                Hashed using HMAC-SHA256 with a secret salt. The raw IP address is never stored
                in our database, logs, or error tracking.
              </li>
            </ul>
          </section>

          {/* b. What we do with it */}
          <section>
            <h2
              className="font-serif font-medium"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              What we do with it
            </h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-body-sm">
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Assessment inputs:</strong>{' '}
                Generate your P&L calculation and personalised action list. Not used for any
                other purpose.
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Email:</strong>{' '}
                One email on 30 October 2026 when acquirers publish average MSF data. Nothing
                else unless you ask.
              </li>
            </ul>
          </section>

          {/* c. What we do NOT do */}
          <section>
            <h2
              className="font-serif font-medium"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              What we do not do
            </h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-body-sm">
              <li>We do not sell data to PSPs, acquirers, or card schemes.</li>
              <li>We do not share data with payment providers.</li>
              <li>We have no commercial relationship with any PSP.</li>
              <li>We do not use your data for advertising.</li>
            </ul>
          </section>

          {/* d. Data retention */}
          <section>
            <h2
              className="font-serif font-medium"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              Data retention
            </h2>
            <ul className="mt-2 list-disc pl-5 space-y-1.5 text-body-sm">
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Session data:</strong>{' '}
                90 days.
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Assessment data:</strong>{' '}
                2 years (for benchmarking research).
              </li>
              <li>
                <strong style={{ color: 'var(--color-text-primary)' }}>Email addresses:</strong>{' '}
                Until the October 2026 send, then deleted within 30 days unless you have asked
                to stay in touch.
              </li>
            </ul>
          </section>

          {/* e. Your rights */}
          <section>
            <h2
              className="font-serif font-medium"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              Your rights
            </h2>
            <p className="mt-2 text-body-sm">
              You may request access to, correction of, or deletion of your data at any time.
              Email{' '}
              <a href={`mailto:${privacyEmail}`} className="underline" style={{ color: 'var(--color-text-primary)' }}>
                {privacyEmail}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* f. Data deletion request */}
          <section>
            <h2
              className="font-serif font-medium"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              Data deletion request
            </h2>
            <p className="mt-2 text-body-sm">
              Email{' '}
              <a href={`mailto:${privacyEmail}`} className="underline" style={{ color: 'var(--color-text-primary)' }}>
                {privacyEmail}
              </a>{' '}
              with subject &quot;Data deletion request&quot;. Include the email address you signed
              up with (if applicable). We will delete your data within 30 days.
            </p>
          </section>

          {/* g. Questions */}
          <section>
            <h2
              className="font-serif font-medium"
              style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
            >
              Questions
            </h2>
            <p className="mt-2 text-body-sm">
              Contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="underline" style={{ color: 'var(--color-text-primary)' }}>
                {contactEmail}
              </a>
              .
            </p>
          </section>

          {/* Footer note */}
          <p className="mt-8 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            nosurcharging.com.au is an independent payments intelligence platform.
            This policy was last updated April 2026.
          </p>
        </div>
      </div>
    </main>
  );
}
