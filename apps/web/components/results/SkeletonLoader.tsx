// SkeletonLoader — per ux-spec §3.11.
// Placeholder shown while the assessment is fetching, replacing the
// previous "Loading results..." text. Mirrors the primary-zone layout
// (verdict, hero number, metric row, problems, action cards) so the
// page does not jump when real content arrives.
//
// Animation: opacity pulses 0.35 → 0.65 (1.5s ease-in-out infinite).
// Background: ink at 10% opacity (rgba(26, 20, 9, 0.1)).
// No border-radius on block skeletons.

const BLOCK_BG = 'rgba(26, 20, 9, 0.1)';
const PULSE = 'skeletonPulse 1.5s ease-in-out infinite';

interface BlockProps {
  width?: string;
  height: string;
  marginTop?: string;
}

function Block({ width = '100%', height, marginTop }: BlockProps) {
  return (
    <div
      data-testid="skeleton-block"
      aria-hidden="true"
      style={{
        width,
        height,
        marginTop,
        background: BLOCK_BG,
        animation: PULSE,
      }}
    />
  );
}

export function SkeletonLoader() {
  return (
    <main
      className="min-h-screen bg-paper"
      role="status"
      aria-live="polite"
      aria-label="Loading your results"
    >
      <div className="mx-auto max-w-results px-5 pb-12 pt-10">
        {/* Category pill placeholder */}
        <Block width="92px" height="22px" />

        {/* Hero number placeholder */}
        <Block width="200px" height="60px" marginTop="20px" />

        {/* Unit text placeholder */}
        <Block width="120px" height="14px" marginTop="12px" />

        {/* Anchor text placeholder */}
        <Block width="280px" height="16px" marginTop="20px" />

        {/* Metric row placeholder — full width, 52px tall */}
        <div
          data-testid="skeleton-metric-row"
          aria-hidden="true"
          className="relative"
          style={{
            marginTop: '32px',
            width: '100%',
            height: '52px',
            background: BLOCK_BG,
            animation: PULSE,
          }}
        >
          {/* Three internal dividers — split row into 4 columns */}
          {[25, 50, 75].map((leftPct) => (
            <div
              key={leftPct}
              style={{
                position: 'absolute',
                top: '8px',
                bottom: '8px',
                left: `${leftPct}%`,
                width: '1px',
                background: 'rgba(255, 255, 255, 0.4)',
              }}
            />
          ))}
        </div>

        {/* Two problem block placeholders */}
        <Block height="88px" marginTop="24px" />
        <Block height="112px" marginTop="12px" />

        {/* Three action card placeholders */}
        <Block height="96px" marginTop="32px" />
        <Block height="96px" marginTop="12px" />
        <Block height="96px" marginTop="12px" />
      </div>
    </main>
  );
}
