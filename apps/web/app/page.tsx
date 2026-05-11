// Homepage — SSR with two opt-in client islands. ux-spec §1.1-1.8.
//
// Section order:
//   1. Sticky nav (ink bg, logo + single CTA)
//   2. HeroSection (paper canvas, italic Your)
//   3. TrustBar (paper-white surface, three columns)
//   4. PreviewSection ('use client' — auto-cycling report scrollytelling)
//   5. FeaturesSection (four questions)
//   6. Bottom CTA (inline)
//   7. Footer
//
// Target: <80KB gzipped JS. The homepage is mostly SSR. Two opt-in
// client islands (HomepageAnalytics + PreviewSection) are wrapped in
// <Suspense> so SSR continues for the rest of the tree.

import { Suspense } from 'react';
import Link from 'next/link';
import { HeroSection } from '@/components/homepage/HeroSection';
import { TrustBar } from '@/components/homepage/TrustBar';
import { SampleResultsSection } from '@/components/homepage/SampleResultsSection';
import { PreviewSection } from '@/components/homepage/PreviewSection';
import { FeaturesSection } from '@/components/homepage/FeaturesSection';
import { Footer } from '@/components/homepage/Footer';
import { HomepageAnalytics } from '@/components/homepage/HomepageAnalytics';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper">
      {/* Analytics island — homepage_viewed on mount + CTA click delegation
          via [data-cta]. Keeps every section server-rendered. */}
      <Suspense>
        <HomepageAnalytics />
      </Suspense>

      {/* Navigation — sticky, ink background */}
      <nav
        className="sticky top-0 z-20 flex items-center justify-between bg-ink px-5"
        style={{ height: '52px' }}
      >
        {/* Logo — "surcharging" portion in italic accent-border.
            The .com.au suffix is hidden below 400px so the logo doesn't
            collide with the sticky CTA at the 375px audit width. */}
        <Link href="/" className="font-serif font-medium text-white" style={{ fontSize: '16px' }}>
          no
          <span className="italic" style={{ color: '#72C4B0' }}>
            surcharging
          </span>
          <span className="hidden text-white/60 min-[400px]:inline" style={{ fontSize: '13px' }}>
            .com.au
          </span>
        </Link>

        {/* Single CTA — pill shape (Modern Fintech Hierarchy). The nav CTA
            is the primary action on this sticky bar, so it shares the same
            reserved pill shape as AccentButton and the hero CTA below. */}
        <Link
          href="/assessment"
          data-cta="nav"
          className="bg-accent text-white transition-opacity duration-150 hover:opacity-90"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            padding: '8px 18px',
            borderRadius: '9999px',
          }}
        >
          Get my free report →
        </Link>
      </nav>

      {/* Section 3 — Hero */}
      <HeroSection />

      {/* Section 3 — Dark countdown band (TrustBar). Fallback height
          matches the post-hydration band so the hero doesn't shift. */}
      <Suspense fallback={<div className="h-[52px]" style={{ background: '#1A1409' }} />}>
        <TrustBar />
      </Suspense>

      {/* Section 4 — "See what merchants get" sample bento. The hero's
          secondary CTA ("See sample report ↓") scrolls to this section
          via the #samples anchor. */}
      <SampleResultsSection />

      {/* Section 5 — "What you'll receive" dark 2-column block with
          static product UI mini-preview. SSR-only now that the
          scrollytelling auto-cycle was retired in M2. */}
      <PreviewSection />

      {/* Section 6 — How it works (four questions) */}
      <FeaturesSection />

      {/* Section 7 — Final CTA. Visual climax of the homepage; 52px
          display serif (36px mobile) with italic emerald accent on
          "your", larger pill padding than the hero CTA for finality. */}
      <section
        className="bg-paper text-center"
        style={{ padding: 'clamp(56px, 9vw, 80px) clamp(18px, 3vw, 28px)' }}
      >
        <p
          className="font-mono uppercase"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '1.4px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Free · No account · Under five minutes
        </p>
        <h2
          className="mx-auto mt-4 font-serif text-ink"
          style={{
            fontSize: 'clamp(36px, 7vw, 52px)',
            fontWeight: 500,
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            maxWidth: '720px',
          }}
        >
          Get{' '}
          <em className="italic text-accent" style={{ fontStyle: 'italic' }}>
            your
          </em>{' '}
          report now.
        </h2>
        <p
          className="mx-auto mt-4 text-ink-secondary"
          style={{
            fontSize: 'clamp(14px, 1.6vw, 15px)',
            lineHeight: 1.6,
            maxWidth: '480px',
          }}
        >
          Find out exactly what October costs your business.
        </p>
        <Link
          href="/assessment"
          data-cta="bottom"
          className="mt-8 inline-flex items-center bg-accent text-white transition-opacity duration-150 hover:opacity-90 focus-visible:opacity-90"
          style={{
            fontSize: '15px',
            fontWeight: 500,
            padding: '16px 36px',
            borderRadius: '9999px',
            gap: '6px',
          }}
        >
          Start my free report <span aria-hidden>→</span>
        </Link>
      </section>

      {/* Section 8 — Footer */}
      <Footer />
    </main>
  );
}
