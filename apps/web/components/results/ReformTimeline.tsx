'use client';

// CB-17: Reform Timeline — non-interactive, purely informational.
// Horizontal line with 6 event dots.
// Progress bar: accent, 0% to ~12% (April 2026 position).
// Below 500px: hide sub-labels, show dates only.

const EVENTS = [
  {
    date: 'Apr 2026',
    label: 'Today',
    sublabel: 'You are here',
    dotStyle: {
      background: '#1A6B5A',
      boxShadow: '0 0 0 3px rgba(26,107,90,0.2)',
    } as React.CSSProperties,
    isToday: true,
  },
  {
    date: 'Aug 2026',
    label: 'Aug 2026',
    sublabel: 'Negotiate window',
    dotStyle: { background: '#1A6B5A' } as React.CSSProperties,
    isToday: false,
  },
  {
    date: '1 Oct 2026',
    label: '1 Oct',
    sublabel: 'Surcharge ban + IC cuts',
    dotStyle: { background: 'var(--color-text-danger)' } as React.CSSProperties,
    isToday: false,
  },
  {
    date: '30 Oct 2026',
    label: '30 Oct',
    sublabel: 'MSF benchmarks published',
    dotStyle: { background: 'var(--color-text-success)' } as React.CSSProperties,
    isToday: false,
  },
  {
    date: '30 Jan 2027',
    label: '30 Jan',
    sublabel: 'Pass-through report',
    dotStyle: { background: 'var(--color-text-success)' } as React.CSSProperties,
    isToday: false,
  },
  {
    date: '1 Apr 2027',
    label: '1 Apr',
    sublabel: 'Foreign card cap',
    dotStyle: { background: 'var(--color-border-secondary)' } as React.CSSProperties,
    isToday: false,
  },
];

export function ReformTimeline() {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ border: '0.5px solid var(--color-border-secondary)' }}
    >
      {/* Track */}
      <div className="relative">
        {/* Background line */}
        <div
          className="absolute top-2 left-0 right-0 h-px"
          style={{ background: 'var(--color-border-tertiary)' }}
        />

        {/* Progress line — accent, ~12% width */}
        <div
          className="absolute top-2 left-0 h-px"
          style={{ width: '12%', background: '#1A6B5A' }}
        />

        {/* Events */}
        <div className="relative flex justify-between">
          {EVENTS.map((event) => (
            <div key={event.date} className="flex flex-col items-center" style={{ minWidth: 0 }}>
              {/* Dot */}
              <div
                className="h-2 w-2 rounded-full relative z-10"
                style={event.dotStyle}
              />

              {/* Date label */}
              <p
                className="mt-1.5 text-center font-mono"
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.5px',
                  color: event.isToday ? '#1A6B5A' : 'var(--color-text-secondary)',
                  fontWeight: event.isToday ? 500 : 400,
                }}
              >
                {event.label}
              </p>

              {/* Sub-label — hidden below 500px */}
              <p
                className="mt-0.5 text-center hidden min-[500px]:block"
                style={{
                  fontSize: '9px',
                  color: 'var(--color-text-tertiary)',
                  maxWidth: '70px',
                }}
              >
                {event.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
