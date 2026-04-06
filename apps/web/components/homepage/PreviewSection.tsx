'use client';

// CB-13: Homepage preview cards.
// Auto-rotate every 3.5s. Manual click resets timer.
// Real calculation data from example volumes.
// Category 1: $600K, Category 2: $2M, Category 3: $8M, Category 4: $3M.

import { useState, useEffect, useRef } from 'react';

interface PreviewData {
  category: 1 | 2 | 3 | 4;
  label: string;
  volume: string;
  verdict: string;
  today: string;
  october: string;
  plSwing: string;
  plPositive: boolean;
  topAction: string;
}

// Real calculation data from the engine (pre-computed for homepage SSR performance)
const PREVIEWS: PreviewData[] = [
  {
    category: 1,
    label: 'Category 1 — Winner',
    volume: '$600K',
    verdict: 'Your costs fall automatically on 1 October.',
    today: '$5,641',
    october: '$5,107',
    plSwing: '+$534',
    plPositive: true,
    topAction: 'Confirm with your PSP that the new interchange caps will flow through automatically.',
  },
  {
    category: 2,
    label: 'Category 2 — Conditional',
    volume: '$2M',
    verdict: "The saving exists — but it won't arrive automatically.",
    today: '$28,000',
    october: '$28,000',
    plSwing: '$0',
    plPositive: false,
    topAction: 'Call your PSP and ask: will you pass through the interchange saving in writing?',
  },
  {
    category: 3,
    label: 'Category 3 — Reprice',
    volume: '$8M',
    verdict: 'Your surcharge revenue disappears on 1 October.',
    today: '-$58,394',
    october: '$30,708',
    plSwing: '-$89,101',
    plPositive: false,
    topAction: 'Calculate your repricing gap and begin adjusting product pricing now.',
  },
  {
    category: 4,
    label: 'Category 4 — Act now',
    volume: '$3M',
    verdict: 'You face both challenges simultaneously.',
    today: '$6,000',
    october: '$40,836',
    plSwing: '-$34,836',
    plPositive: false,
    topAction: 'Call your PSP this week for a rate review — you need both repricing and rate transparency.',
  },
];

const PILL_COLOURS: Record<number, { dot: string }> = {
  1: { dot: 'var(--color-text-success)' },
  2: { dot: '#BA7517' },
  3: { dot: 'var(--color-text-danger)' },
  4: { dot: 'var(--color-text-danger)' },
};

export function PreviewSection() {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % PREVIEWS.length);
    }, 3500);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabClick = (index: number) => {
    setActive(index);
    startTimer(); // Reset timer on manual click
  };

  const preview = PREVIEWS[active]!;

  return (
    <section
      className="py-12 px-5"
      style={{ background: 'var(--color-background-secondary)' }}
    >
      <div className="mx-auto max-w-results">
        {/* Label */}
        <p
          className="text-center font-medium"
          style={{
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'var(--color-text-secondary)',
          }}
        >
          SAMPLE RESULTS
        </p>

        {/* Category tabs */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PREVIEWS.map((p, i) => (
            <button
              key={p.category}
              type="button"
              onClick={() => handleTabClick(i)}
              className="rounded-pill px-3 py-1.5 text-caption font-medium transition-all duration-150"
              style={
                i === active
                  ? {
                      background: '#FAEEDA',
                      border: '1px solid #BA7517',
                      color: '#633806',
                    }
                  : {
                      background: 'transparent',
                      border: '0.5px solid var(--color-border-secondary)',
                      color: 'var(--color-text-secondary)',
                    }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Preview card — fade transition */}
        <div
          className="mt-4 rounded-xl p-5 transition-opacity duration-200"
          style={{
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-secondary)',
          }}
        >
          {/* Top strip */}
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: PILL_COLOURS[preview.category]?.dot }}
            />
            <span className="text-caption font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Category {preview.category}
            </span>
            <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
              · {preview.volume} annual volume
            </span>
          </div>

          <p
            className="mt-2 font-serif font-medium"
            style={{ fontSize: '15px', color: 'var(--color-text-primary)' }}
          >
            {preview.verdict}
          </p>

          {/* Metrics row */}
          <div
            className="mt-3 flex rounded-lg overflow-hidden"
            style={{ border: '0.5px solid var(--color-border-tertiary)' }}
          >
            {[
              { label: 'Today', value: preview.today },
              { label: 'Oct 2026', value: preview.october },
              {
                label: 'P&L swing',
                value: preview.plSwing,
                colour: preview.plPositive
                  ? 'var(--color-text-success)'
                  : 'var(--color-text-danger)',
              },
            ].map((cell, i) => (
              <div
                key={cell.label}
                className="flex-1 px-3 py-2"
                style={
                  i < 2
                    ? { borderRight: '0.5px solid var(--color-border-tertiary)' }
                    : undefined
                }
              >
                <p
                  className="font-medium"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '1px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {cell.label}
                </p>
                <p
                  className="mt-0.5 font-mono font-medium"
                  style={{
                    fontSize: '18px',
                    color: cell.colour ?? 'var(--color-text-primary)',
                  }}
                >
                  {cell.value}
                </p>
              </div>
            ))}
          </div>

          {/* Action preview */}
          <p
            className="mt-3 text-caption"
            style={{ color: 'var(--color-text-secondary)', lineHeight: '1.55' }}
          >
            <span className="font-mono" style={{ color: '#BA7517', fontSize: '10px' }}>
              This week →{' '}
            </span>
            {preview.topAction}
          </p>
        </div>
      </div>
    </section>
  );
}
