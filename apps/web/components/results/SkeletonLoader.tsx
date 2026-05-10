// SkeletonLoader — matches the linear single-column results layout.
// Top bar + max-w-3xl content column. No sidebar (the M1 ruthless cut
// removed it).
//
// Animation: opacity pulses 0.35 → 0.65 (1.5s ease-in-out infinite).
// Background: ink at 10% opacity (rgba(26, 20, 9, 0.1)).

const BLOCK_BG = 'rgba(26, 20, 9, 0.1)';
const PULSE = 'skeletonPulse 1.5s ease-in-out infinite';

interface BlockProps {
  width?: string;
  height: string;
  marginTop?: string;
  rounded?: boolean;
}

function Block({ width = '100%', height, marginTop, rounded }: BlockProps) {
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
        borderRadius: rounded ? '8px' : undefined,
      }}
    />
  );
}

export function SkeletonLoader() {
  return (
    <div
      className="min-h-screen bg-paper"
      role="status"
      aria-live="polite"
      aria-label="Loading your results"
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b border-rule bg-paper-white"
        style={{ height: '44px' }}
      >
        <Block width="140px" height="14px" rounded />
        <div className="w-px h-4 bg-rule" />
        <Block width="80px" height="18px" rounded />
        <Block width="70px" height="14px" rounded />
      </div>

      {/* Linear content column */}
      <main className="mx-auto max-w-3xl px-5 pt-6 pb-20 md:pb-12 space-y-8">
        {/* Hero block — situation pill, headline, P&L, body */}
        <div>
          <Block width="92px" height="22px" rounded />
          <Block width="75%" height="20px" marginTop="16px" />
          <Block width="260px" height="44px" marginTop="16px" />
          <Block width="180px" height="14px" marginTop="8px" />
          <Block width="100%" height="14px" marginTop="16px" />
          <Block width="90%" height="14px" marginTop="6px" />
        </div>

        {/* Metric cards block — 2x2 on mobile / 2x3 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Block height="100px" rounded />
          <Block height="100px" rounded />
          <Block height="100px" rounded />
          <Block height="100px" rounded />
          <Block height="100px" rounded />
          <Block height="100px" rounded />
        </div>

        {/* Problem cards block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <Block height="88px" rounded />
          <Block height="88px" rounded />
        </div>

        {/* Action list block */}
        <div>
          <Block width="180px" height="12px" />
          <Block height="80px" marginTop="16px" rounded />
          <Block height="80px" marginTop="8px" rounded />
          <Block height="80px" marginTop="8px" rounded />
        </div>

        {/* Refine block */}
        <div>
          <Block width="160px" height="12px" />
          <Block height="200px" marginTop="16px" rounded />
        </div>
      </main>
    </div>
  );
}
