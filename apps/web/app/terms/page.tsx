// Terms & Conditions page — covers acceptance, use, IP, warranties,
// third-party links, and amendments. Static SSR. Wording must be reviewed
// by an Australian solicitor before public launch.

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions — nosurcharging.com.au',
  description:
    'Terms and conditions for use of nosurcharging.com.au — acceptance, permitted use, intellectual property, no-warranty disclaimer, third-party links, and amendments.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-paper">
      <article className="mx-auto max-w-results px-5 pt-16 pb-20">
        <Link
          href="/"
          className="block text-accent hover:underline"
          style={{
            fontSize: '13px',
            textUnderlineOffset: '2px',
            marginBottom: '40px',
          }}
        >
          ← Back
        </Link>

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
          Terms &amp; Conditions
        </h1>
        <p
          className="text-ink-faint"
          style={{ fontSize: '13px', marginBottom: '48px' }}
        >
          Last updated April 2026 · nosurcharging.com.au
        </p>

        <Section title="Acceptance of terms">
          <p>
            By accessing or using nosurcharging.com.au, you agree to be bound
            by these Terms and Conditions. If you do not agree, please do not
            use this website. These terms apply to all visitors, users, and
            others who access or use the service.
          </p>
        </Section>

        <Section title="Use of the service">
          <p>
            This website is provided for general informational purposes only.
            You may use the assessment tool and any outputs it generates solely
            for your own internal business purposes. You must not reproduce,
            distribute, modify, or commercialise any content from this website
            without prior written permission from nosurcharging.com.au. You
            must not use this website in any way that is unlawful, harmful, or
            that could damage, disable, or impair the service.
          </p>
        </Section>

        <Section title="Intellectual property">
          <p>
            All content on this website — including text, calculations,
            methodology, negotiation scripts, action plans, and design — is
            the property of nosurcharging.com.au and is protected by Australian
            copyright law. The RBA data and interchange rate schedules
            referenced are publicly available government publications and
            remain the property of their respective owners.
          </p>
        </Section>

        <Section title="No warranties">
          <p>
            This website is provided on an &lsquo;as is&rsquo; and &lsquo;as
            available&rsquo; basis without any warranty of any kind, express
            or implied, including but not limited to warranties of
            merchantability, fitness for a particular purpose, or
            non-infringement. nosurcharging.com.au does not warrant that the
            service will be uninterrupted, error-free, or free of viruses or
            other harmful components.
          </p>
        </Section>

        <Section title="Links to third-party sites">
          <p>
            This website may contain links to third-party websites including
            payment service providers and industry bodies. These links are
            provided for convenience only. nosurcharging.com.au has no control
            over the content of those sites and accepts no responsibility for
            them or for any loss or damage that may arise from your use of
            them.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            nosurcharging.com.au reserves the right to modify these terms at
            any time. Changes are effective immediately upon posting to this
            website. Your continued use of the website after any changes
            constitutes acceptance of the new terms. These terms are governed
            by the laws of New South Wales, Australia.
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
        style={{
          fontSize: '13px',
          color: '#6B5E4A',
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </section>
  );
}
