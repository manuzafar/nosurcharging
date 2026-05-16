'use client';

// Results page sticky header — stripped to a minimal two-element band per
// RESULTS_HEADER_REDESIGN_BRIEF (May 2026).
//
// LEFT:  brand wordmark (no surcharging.com.au), unchanged
// RIGHT: "Start a new report →" link routing to /assessment
//
// Removed in this revision:
//   - Situation chip ("Situation 4") — internal jargon, sub-readability size.
//   - plSwing dollar display — relocated to RefinementPanel.tsx where the
//     merchant is actively editing inputs and needs co-located feedback.
//   - "Result looks off?" button — relocated to RefinementPanel.tsx where
//     it sits adjacent to the refinement controls (the natural moment for
//     the merchant to question the result is after they've tried to refine
//     it).
//
// FeedbackModal is no longer mounted here; the relocated trigger inside
// RefinementPanel mounts its own copy.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function ResultsTopBar() {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-5 min-[501px]:px-7"
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

      {/* RIGHT — restart link. Label shortens on the narrowest viewports
          (below 400px) to "New report →" so the band never wraps. */}
      <Link
        href="/assessment"
        className="inline-flex items-center shrink-0 hover:!text-white transition-colors duration-150"
        style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px',
          gap: '6px',
        }}
      >
        <span className="hidden min-[400px]:inline">Start a new report</span>
        <span className="inline min-[400px]:hidden">New report</span>
        <ArrowRight size={14} aria-hidden />
      </Link>
    </header>
  );
}
