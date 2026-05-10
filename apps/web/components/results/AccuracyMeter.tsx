'use client';

// AccuracyMeter — 80px mini progress bar used as the Refine
// SectionHeader meta. Replaces the previous "65%" plain text per
// the editorial polish brief.
//
// Track sits on the secondary background; fill is emerald + clamped
// to 0-100. The percent label reads to the right of the bar in mono
// 11px so the meta still carries the number for screen readers and
// quick scanners.

interface AccuracyMeterProps {
  pct: number;
}

export function AccuracyMeter({ pct }: AccuracyMeterProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <span
      className="inline-flex items-center"
      style={{ gap: '8px' }}
      aria-label={`Accuracy ${Math.round(clamped)} percent`}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: '80px',
          height: '4px',
          borderRadius: '999px',
          background: 'var(--color-background-secondary)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'block',
            width: `${clamped}%`,
            height: '100%',
            background: 'var(--color-text-success)',
            transition: 'width 200ms ease-out',
          }}
        />
      </span>
      <span
        className="font-mono"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--color-text-tertiary)',
          letterSpacing: '0.04em',
        }}
      >
        {Math.round(clamped)}%
      </span>
    </span>
  );
}
