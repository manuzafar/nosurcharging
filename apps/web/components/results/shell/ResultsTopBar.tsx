'use client';

// Unified dark sticky header for the results page. Per the Ruthless Cut
// (M1), the right-side CTAs ("Save result" + "Get help") are gone — the
// PDF artifact handoff (M2) and the quiet $149 upsell at the bottom of
// the page replace them. MobileBottomBar was deleted with the sidebar.
//
// Remaining structure: branded logo (left) · situation pill + P&L +
// accuracy indicator + "Result looks off?" link (centre).

import { useState } from 'react';
import Link from 'next/link';
import { SITUATION_PILLS } from '@/components/results/VerdictSection';
import { FeedbackModal } from '@/components/results/FeedbackModal';
import { Analytics } from '@/lib/analytics';

interface ResultsTopBarProps {
  category: 1 | 2 | 3 | 4 | 5;
  plSwing: number;
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
  volume,
  assessmentId,
}: ResultsTopBarProps) {
  const pillStyle = SITUATION_PILLS[category];
  const isPositive = plSwing >= 0;
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center gap-4 px-5"
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

          {/* Result looks off? — hidden on mobile.
              The accuracy indicator that lived here moved into the
              RefinementPanel header in M2. The analytics event still
              records accuracy_pct as 0 from this surface; the in-page
              feedback flow captures the live accuracy separately. */}
          <button
            type="button"
            onClick={() => {
              Analytics.resultLooksOff({ category, accuracy_pct: 0 });
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
