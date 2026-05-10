'use client';

// ReformTimelineCompact — compact 5-row reform calendar.
//
// Per docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §6: vertical list of
// date+label rows on mobile (single column); horizontal nodes on
// desktop. Reads from AU_REFORM_DATES (the existing source of truth)
// + a synthesised "Now" anchor. No "October 1 callout" component —
// the date marker carries that weight.

import { CalendarDays } from 'lucide-react';
import { AU_REFORM_DATES } from '@nosurcharging/calculations/constants/au';

interface TimelineRow {
  date: string;
  label: string;
  description: string;
  emphasis?: 'now' | 'reform' | 'normal';
}

function buildRows(now: Date): TimelineRow[] {
  const fmt = (iso: string): string => {
    const d = new Date(iso + 'T00:00:00Z');
    return d.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };
  const nowLabel = now.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return [
    {
      date: nowLabel,
      label: 'Today',
      description: 'You are here',
      emphasis: 'now',
    },
    {
      date: fmt(AU_REFORM_DATES.surchargeBan),
      label: 'Surcharge ban + interchange caps',
      description:
        'Visa, Mastercard, and eftpos surcharges become illegal. Domestic interchange caps drop.',
      emphasis: 'reform',
    },
    {
      date: fmt(AU_REFORM_DATES.msfPublication),
      label: 'MSF benchmarks published',
      description:
        'Large processors must publish their average merchant service fees. Compare your rate.',
    },
    {
      date: fmt(AU_REFORM_DATES.passThroughReport),
      label: 'RBA pass-through report',
      description:
        'The RBA reports how much of the interchange saving actually reached merchants.',
    },
    {
      date: fmt(AU_REFORM_DATES.foreignCardCap),
      label: 'Foreign card IC cap',
      description:
        'Foreign card interchange capped at 1.0% (excludes scheme fees).',
    },
  ];
}

function dotStyles(emphasis: TimelineRow['emphasis']): {
  bg: string;
  color: string;
} {
  if (emphasis === 'now') {
    return {
      bg: 'var(--color-text-success)',
      color: '#FFFFFF',
    };
  }
  if (emphasis === 'reform') {
    return {
      bg: 'var(--color-text-danger)',
      color: '#FFFFFF',
    };
  }
  return {
    bg: 'var(--color-background-secondary)',
    color: 'var(--color-text-tertiary)',
  };
}

export function ReformTimelineCompact() {
  const rows = buildRows(new Date());

  // Eyebrow ("Reform timeline") moved out to page-level SectionHeader.
  // Breakpoints follow CLAUDE.md's 500px convention.
  return (
    <section className="px-5 min-[501px]:px-8" aria-label="Reform timeline">
      {/* Mobile / narrow — vertical stack of date rows */}
      <ol className="min-[501px]:hidden flex flex-col list-none p-0" style={{ gap: '14px' }}>
        {rows.map((row, i) => {
          const styles = dotStyles(row.emphasis);
          return (
            <li
              key={i}
              className="flex items-start"
              style={{ gap: '12px' }}
            >
              <span
                className="flex items-center justify-center shrink-0"
                aria-hidden
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: styles.bg,
                  color: styles.color,
                  marginTop: '2px',
                }}
              >
                <CalendarDays size={11} aria-hidden />
              </span>
              <div className="flex-1">
                <p
                  className="font-mono"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color:
                      row.emphasis === 'now'
                        ? 'var(--color-text-success)'
                        : row.emphasis === 'reform'
                          ? 'var(--color-text-danger)'
                          : 'var(--color-text-secondary)',
                    marginBottom: '2px',
                  }}
                >
                  {row.date}
                </p>
                <p
                  className="font-bold"
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                    marginBottom: '3px',
                    lineHeight: 1.4,
                  }}
                >
                  {row.label}
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)',
                    lineHeight: 1.55,
                  }}
                >
                  {row.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop — horizontal nodes connected by a hairline */}
      <ol
        className="hidden min-[501px]:flex list-none p-0 relative"
        style={{ gap: '12px' }}
      >
        {/* Hairline connecting all dots */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '12px',
            right: '12px',
            top: '12px',
            height: '1px',
            background: 'var(--color-border-secondary)',
            zIndex: 0,
          }}
        />
        {rows.map((row, i) => {
          const styles = dotStyles(row.emphasis);
          return (
            <li key={i} className="flex-1 relative" style={{ zIndex: 1 }}>
              <span
                className="block"
                aria-hidden
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: styles.bg,
                  color: styles.color,
                  marginBottom: '12px',
                }}
              />
              <p
                className="font-mono"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color:
                    row.emphasis === 'now'
                      ? 'var(--color-text-success)'
                      : row.emphasis === 'reform'
                        ? 'var(--color-text-danger)'
                        : 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                {row.date}
              </p>
              <p
                className="font-bold"
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-primary)',
                  marginBottom: '4px',
                  lineHeight: 1.35,
                }}
              >
                {row.label}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  lineHeight: 1.5,
                }}
              >
                {row.description}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
