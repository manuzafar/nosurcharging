// Homepage — SSR. ux-spec §1.1-1.8.
//
// Section order:
//   1. Sticky nav (ink bg, logo + single CTA)
//   2. ProofBar (accent-light strip)
//   3. HeroSection (paper canvas, italic Your)
//   4. TrustBar (paper-white surface, three columns)
//   5. PreviewSection (situations 2x2 grid)
//   6. FeaturesSection (four questions)
//   7. Bottom CTA (inline)
//   8. Footer
//
// Target: <80KB gzipped JS. All sections are pure SSR after the
// Phase 2 rewrite — no 'use client' directives in the homepage tree.

import Link from 'next/link';
import { ProofBar } from '@/components/homepage/ProofBar';
import { HeroSection } from '@/components/homepage/HeroSection';
import { TrustBar } from '@/components/homepage/TrustBar';
import { PreviewSection } from '@/components/homepage/PreviewSection';
import { FeaturesSection } from '@/components/homepage/FeaturesSection';
import { Footer } from '@/components/homepage/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper">
      {/* Navigation — sticky, ink background */}
      <nav
        className="sticky top-0 z-20 flex items-center justify-between bg-ink px-5"
        style={{ height: '52px' }}
      >
        {/* Logo — "surcharging" portion in italic accent-border */}
        <Link href="/" className="font-serif font-medium text-white" style={{ fontSize: '16px' }}>
          no
          <span className="italic" style={{ color: '#72C4B0' }}>
            surcharging
          </span>
          <span className="text-white/60" style={{ fontSize: '13px' }}>
            .com.au
          </span>
        </Link>

        {/* Single CTA — solid accent, square corners */}
        <Link
          href="/assessment"
          className="bg-accent text-white transition-opacity duration-150 hover:opacity-90"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            padding: '8px 18px',
          }}
        >
          Generate my free report →
        </Link>
      </nav>

      {/* Section 2 — Proof bar */}
      <ProofBar />

      {/* Section 3 — Hero */}
      <HeroSection />

      {/* Section 4 — Trust bar */}
      <TrustBar />

      {/* Section 5 — Situations preview */}
      <PreviewSection />

      {/* Section 6 — How it works (four questions) */}
      <FeaturesSection />

      {/* Section 7 — Bottom CTA */}
      <section className="border-b border-rule bg-paper px-5 text-center" style={{ padding: '68px 20px' }}>
        <p className="text-[10px] font-medium uppercase tracking-[3px] text-ink-faint">
          Free · No account · Under five minutes
        </p>
        <h2
          className="mt-4 font-serif text-ink"
          style={{
            fontSize: '34px',
            fontWeight: 500,
            letterSpacing: '-1.2px',
            lineHeight: '1.1',
          }}
        >
          Get your report now.
        </h2>
        <p
          className="mx-auto mt-3 max-w-[420px] text-ink-secondary"
          style={{ fontSize: '15px', lineHeight: '1.55' }}
        >
          Find out exactly what October costs your business.
        </p>
        <Link
          href="/assessment"
          className="mt-7 inline-block bg-accent text-white transition-opacity duration-150 hover:opacity-90 focus-visible:opacity-90"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            padding: '14px 32px',
            outline: '3px solid #1A6B5A',
            outlineOffset: '2px',
          }}
        >
          Generate my free report →
        </Link>
      </section>

      {/* Section 8 — Footer */}
      <Footer />
    </main>
  );
}
