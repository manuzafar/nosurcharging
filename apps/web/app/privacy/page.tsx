// SR-10: Privacy policy. SSR — no 'use client'.
// Required before any data collection.
// Linked from: disclaimer checkbox, email capture, site footer.
// Layout matches /disclaimer and /terms — paper background, max-w-results.

import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/BackButton';

export const metadata: Metadata = {
  title: 'Privacy Policy — nosurcharging.com.au',
  description:
    'How nosurcharging.com.au collects, uses, and protects your data.',
};

const privacyEmail =
  process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? 'privacy@nosurcharging.com.au';
const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@nosurcharging.com.au';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper">
      <article className="mx-auto max-w-results px-5 pt-16 pb-20">
        <BackButton />

        <h1
          className="font-serif text-ink"
          style={{
            fontSize: '32px',
            fontWeight: 500,
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
            marginBottom: '6px',
          }}
        >
          Privacy Policy
        </h1>
        <p
          className="text-ink-faint"
          style={{ fontSize: '13px', marginBottom: '48px' }}
        >
          Last updated April 2026 · nosurcharging.com.au
        </p>

        <Section title="Who we are">
          <p>
            nosurcharging.com.au is an independent payments intelligence
            platform operated in Australia. We are not affiliated with any
            payment service provider, bank, or financial institution. This
            Privacy Policy explains what information we collect when you use
            our website, how we use it, and your rights in relation to it.
          </p>
        </Section>

        <Section title="What information we collect">
          <p>
            Assessment inputs. When you complete our assessment, we collect
            the business information you provide — your approximate annual
            card volume, payment plan type, payment provider, industry, and
            whether you currently add a surcharge to card payments. This
            information is used solely to generate your personalised report.
          </p>
          <p>
            Session information. We use a session identifier to keep your
            assessment connected as you move through the steps. This
            identifier is anonymous and is not linked to your name or any
            other identifying information.
          </p>
          <p>
            Email address. Only if you choose to provide it. We ask for your
            email address to deliver your results, send reform reminders, or
            notify you when benchmark data becomes available. Providing your
            email is entirely optional — you can complete the assessment
            without it.
          </p>
          <p>
            Usage data. We collect anonymised information about how visitors
            use our website — which pages are visited, how the assessment is
            navigated, and which sections of results are engaged with. This
            data is collected in aggregate and is not linked to individual
            users unless an email address has been provided, in which case a
            one-way hash is used rather than the address itself.
          </p>
        </Section>

        <Section title="How we use your information">
          <p>
            To generate your personalised report. Your assessment inputs are
            used to calculate your estimated P&amp;L impact and to produce
            your action plan, negotiation brief, and readiness checklist.
          </p>
          <p>
            To deliver your results. If you provide your email address, we
            use it to send your report, reform reminders, and benchmark data
            when available.
          </p>
          <p>
            To improve the service. Aggregated, anonymised usage data helps
            us understand which parts of the tool are most useful and where
            merchants need more clarity. We do not use individual assessment
            data for this purpose.
          </p>
          <p>
            To maintain security. We process connection information to detect
            and prevent abuse and unauthorised access.
          </p>
        </Section>

        <Section title="What we do not do">
          <p>We do not sell your information to any third party.</p>
          <p>
            We do not share your assessment data with payment service
            providers, banks, acquirers, or card schemes.
          </p>
          <p>
            We do not use your information for third-party advertising or
            marketing.
          </p>
          <p>
            We do not make automated decisions about you using your personal
            data.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Essential cookies. We use a session cookie to keep your
            assessment connected as you move through the four steps. This
            cookie is strictly necessary for the service to function. It
            expires within 90 days or when you close your browser, whichever
            comes first.
          </p>
          <p>
            Analytics cookies. We use cookies to understand how visitors use
            our website at an aggregate level. These cookies do not identify
            you personally. You can decline analytics cookies through your
            browser settings or when prompted on the site.
          </p>
        </Section>

        <Section title="Third-party service providers">
          <p>
            We use third-party service providers to operate this website,
            including providers of database infrastructure, email delivery,
            and analytics services. These providers process data on our
            behalf and are bound by confidentiality obligations. We do not
            authorise them to use your data for their own purposes.
          </p>
          <p>
            Some of our service providers are located outside Australia,
            including in the United States. Where data is transferred
            internationally, we take reasonable steps to ensure it receives a
            comparable level of protection to that required under Australian
            law.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            Assessment data is retained for up to two years to support
            benchmarking and research. After that period it is deleted or
            permanently anonymised.
          </p>
          <p>
            Email addresses are retained until 30 days after the October 2026
            benchmark report is sent, then permanently deleted — unless you
            have asked to remain in contact, in which case we will seek your
            consent before continuing to contact you.
          </p>
          <p>Session identifiers are deleted after 90 days.</p>
          <p>
            Anonymised usage data may be retained indefinitely for research
            purposes.
          </p>
        </Section>

        <Section title="Your rights and contact">
          <p>
            Under the Australian Privacy Act 1988, you have the right to
            request access to the personal information we hold about you, to
            request correction of inaccurate or incomplete information, and
            to request deletion of your personal information subject to any
            legal obligations we may have to retain it.
          </p>
          <p>
            To exercise any of these rights, email{' '}
            <MailtoLink email={privacyEmail} />. We will respond within 30
            days.
          </p>
          <p>
            To withdraw consent to email communications at any time, use the
            unsubscribe link in any email we send you.
          </p>
          <p>
            For general enquiries, contact us at{' '}
            <MailtoLink email={contactEmail} />.
          </p>
        </Section>

        <p
          className="text-ink-faint"
          style={{
            fontSize: '13px',
            lineHeight: 1.65,
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '0.5px solid #DDD5C8',
          }}
        >
          We may update this Privacy Policy from time to time. When we do, we
          will update the date at the top of this page. Continued use of the
          website after an update constitutes acceptance of the revised
          policy. This policy was last updated April 2026.
        </p>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="text-ink"
        style={{
          fontSize: '15px',
          fontWeight: 700,
          marginTop: '40px',
          marginBottom: '12px',
        }}
      >
        {title}
      </h2>
      <div
        className="space-y-4"
        style={{ fontSize: '13px', color: '#6B5E4A', lineHeight: 1.65 }}
      >
        {children}
      </div>
    </section>
  );
}

function MailtoLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="hover:opacity-80"
      style={{
        color: '#1A6B5A',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      }}
    >
      {email}
    </a>
  );
}
