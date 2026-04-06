// Homepage — SSR. Only PreviewSection needs 'use client' (rotating tabs).
// Target: <80KB gzipped JS.

import Link from 'next/link';
import { HeroSection } from '@/components/homepage/HeroSection';
import { PreviewSection } from '@/components/homepage/PreviewSection';
import { FeaturesSection } from '@/components/homepage/FeaturesSection';
import { Footer } from '@/components/homepage/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-background-primary)' }}>
      {/* Navigation — 52px, logo left, actions right */}
      <nav
        className="flex items-center justify-between px-5"
        style={{
          height: '52px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        {/* Logo — "surcharging" portion in amber */}
        <Link href="/" className="font-serif font-medium" style={{ fontSize: '16px' }}>
          <span style={{ color: 'var(--color-text-primary)' }}>no</span>
          <span style={{ color: '#BA7517' }}>surcharging</span>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>.com.au</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          <a
            href="#how-it-works"
            className="text-body-sm hidden min-[500px]:inline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            How it works
          </a>
          <Link
            href="/assessment"
            className="rounded-lg px-4 py-1.5 text-body-sm font-medium transition-opacity duration-150 hover:opacity-90"
            style={{
              border: '1px solid #BA7517',
              color: '#BA7517',
            }}
          >
            Start assessment
          </Link>
        </div>
      </nav>

      {/* Hero — full-bleed dark */}
      <HeroSection />

      {/* Preview — rotating category tabs */}
      <PreviewSection />

      {/* Features — "How it works" */}
      <div id="how-it-works">
        <FeaturesSection />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
