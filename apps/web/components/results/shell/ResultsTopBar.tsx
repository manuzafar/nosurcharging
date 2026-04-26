'use client';

// Unified dark sticky header for the results page. Replaces the previous
// paper-white 44px bar with a single 56px ink bar that combines the
// homepage-style branded logo on the left, result context in the middle
// (situation pill + P&L + accuracy + feedback link), and CTAs on the right
// ("Save result" + "Get help"). MobileBottomBar still renders below the
// fold on mobile and is unchanged.

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { SITUATION_PILLS } from '@/components/results/VerdictSection';
import { FeedbackModal } from '@/components/results/FeedbackModal';
import { Analytics } from '@/lib/analytics';

interface ResultsTopBarProps {
  category: 1 | 2 | 3 | 4;
  plSwing: number;
  accuracy: number;
  volume: number;
  assessmentId?: string;
}

function formatSignedDollar(value: number): string {
  if (value === 0) return '$0';
  return (value > 0 ? '+' : '−') + '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

export function ResultsTopBar({
  category,
  plSwing,
  accuracy,
  volume,
  assessmentId,
}: ResultsTopBarProps) {
  const pillStyle = SITUATION_PILLS[category];
  const isPositive = plSwing >= 0;
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL ?? '#';

  const handleSave = useCallback(() => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }, []);

  const handleHelpClick = () => {
    Analytics.ctaClicked({
      cta_type: 'consulting',
      cta_location: 'top_bar',
      category,
    });
  };

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5"
        style={{ background: '#1A1409', height: '56px' }}
      >
        {/* LEFT — branded logo, identical to homepage nav */}
        <Link
          href="/"
          className="font-serif font-medium text-white shrink-0"
          style={{ fontSize: '16px' }}
        >
          no
          <span className="italic" style={{ color: '#72C4B0' }}>
            surcharging
          </span>
          <span
            className="hidden text-white/60 min-[400px]:inline"
            style={{ fontSize: '13px' }}
          >
            .com.au
          </span>
        </Link>

        {/* CENTRE — result context */}
        <div className="flex items-center" style={{ gap: '10px' }}>
          {/* Vertical separator */}
          <div
            aria-hidden
            style={{
              width: '1px',
              height: '20px',
              background: 'rgba(255,255,255,0.15)',
              marginRight: '2px',
            }}
          />

          {/* Situation pill */}
          <span
            className="font-bold uppercase shrink-0"
            style={{
              ...pillStyle,
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            Situation {category}
          </span>

          {/* P&L figure */}
          <span
            className="font-mono shrink-0"
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: isPositive ? '#1A6B5A' : '#E57373',
            }}
          >
            {formatSignedDollar(plSwing)}
          </span>

          {/* Accuracy indicator — hidden on mobile */}
          <span
            className="hidden md:inline shrink-0"
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Accuracy ▪ {Math.round(accuracy)}%
          </span>

          {/* Result looks off? — hidden on mobile */}
          <button
            type="button"
            onClick={() => {
              Analytics.resultLooksOff({ category, accuracy_pct: accuracy });
              setFeedbackOpen(true);
            }}
            className="hidden md:inline cursor-pointer hover:!text-white/60 hover:underline shrink-0"
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.35)',
              background: 'none',
              border: 'none',
              padding: 0,
              textUnderlineOffset: '2px',
            }}
          >
            Result looks off?
          </button>
        </div>

        {/* RIGHT — CTAs */}
        <div className="flex items-center shrink-0" style={{ gap: '8px' }}>
          {/* Save result — hidden on mobile */}
          <button
            type="button"
            onClick={handleSave}
            className="hidden md:inline-flex cursor-pointer hover:!text-white hover:!border-white/40"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '5px 12px',
              borderRadius: '100px',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
          >
            {saved ? 'Copied' : 'Save result'}
          </button>

          {/* Get help — primary CTA, always visible */}
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleHelpClick}
            className="hover:opacity-85"
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#1A6B5A',
              padding: '6px 14px',
              borderRadius: '100px',
              transition: 'opacity 150ms ease',
            }}
          >
            Get help
          </a>
        </div>
      </header>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        category={category}
        volume={volume}
        assessmentId={assessmentId}
      />
    </>
  );
}
