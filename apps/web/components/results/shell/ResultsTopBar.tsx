'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SITUATION_PILLS } from '@/components/results/VerdictSection';
import { FeedbackModal } from '@/components/results/FeedbackModal';

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

export function ResultsTopBar({ category, plSwing, accuracy, volume, assessmentId }: ResultsTopBarProps) {
  const pillStyle = SITUATION_PILLS[category];
  const isPositive = plSwing >= 0;
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b border-rule bg-paper-white"
        style={{ height: '44px' }}
      >
        {/* Brand — matches site metadata identity */}
        <Link
          href="/"
          className="shrink-0"
          style={{
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          nosurcharging.com.au
        </Link>

        {/* Divider */}
        <div className="w-px h-4 bg-rule shrink-0" />

        {/* Category pill */}
        <span
          className="font-medium uppercase shrink-0"
          style={{
            ...pillStyle,
            fontSize: '9px',
            letterSpacing: '1px',
            padding: '2px 8px',
            borderRadius: '20px',
          }}
        >
          Situation {category}
        </span>

        {/* P&L number */}
        <span
          className="font-mono shrink-0"
          style={{
            fontSize: '18px',
            fontWeight: 500,
            color: isPositive ? 'var(--color-text-success)' : 'var(--color-text-danger)',
          }}
        >
          {formatSignedDollar(plSwing)}
        </span>

        {/* Accuracy indicator */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            Accuracy
          </span>
          <div
            className="rounded-full overflow-hidden"
            style={{ width: '56px', height: '4px', background: '#E8E4DD' }}
          >
            <div
              className="rounded-full"
              style={{
                height: '100%',
                width: `${Math.round(accuracy)}%`,
                background: '#1A6B5A',
                transition: 'width 300ms ease',
              }}
            />
          </div>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-accent)' }}>
            {accuracy}%
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Feedback link */}
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="hidden sm:inline cursor-pointer"
          style={{
            color: 'var(--color-text-tertiary)',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '12px',
          }}
        >
          Result looks off?
        </button>
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
