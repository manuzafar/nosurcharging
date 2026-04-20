// SkeletonLoader — matches two-column shell layout.
// Desktop: top bar + sidebar + content column.
// Mobile: top bar + content column.
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
      {/* Top bar skeleton */}
      <div
        className="sticky top-0 z-50 flex items-center gap-3 px-4 border-b border-rule bg-paper-white"
        style={{ height: '44px' }}
      >
        <Block width="140px" height="14px" rounded />
        <div className="w-px h-4 bg-rule" />
        <Block width="80px" height="18px" rounded />
        <Block width="70px" height="14px" rounded />
        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          <Block width="48px" height="4px" rounded />
          <Block width="28px" height="12px" rounded />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar skeleton — desktop only */}
        <div
          className="hidden md:block shrink-0 border-r border-rule"
          style={{ width: '200px' }}
        >
          <div className="pt-6 pb-4 px-4">
            {/* Group 1 */}
            <Block width="50px" height="9px" marginTop="0" />
            <Block width="100%" height="14px" marginTop="12px" rounded />
            <Block width="100%" height="14px" marginTop="6px" rounded />

            {/* Group 2 */}
            <Block width="70px" height="9px" marginTop="24px" />
            <Block width="100%" height="14px" marginTop="12px" rounded />
            <Block width="100%" height="14px" marginTop="6px" rounded />

            {/* Group 3 */}
            <Block width="60px" height="9px" marginTop="24px" />
            <Block width="100%" height="14px" marginTop="12px" rounded />
          </div>
        </div>

        {/* Content skeleton */}
        <main className="flex-1 min-w-0 px-5 pb-12 mx-auto max-w-results">
          {/* Overview section */}
          <div className="pt-8">
            {/* Category pill */}
            <Block width="92px" height="22px" rounded />

            {/* Headline */}
            <Block width="75%" height="20px" marginTop="16px" />

            {/* Range number */}
            <Block width="260px" height="36px" marginTop="16px" />

            {/* Subtext */}
            <Block width="180px" height="14px" marginTop="8px" />

            {/* Body */}
            <Block width="100%" height="14px" marginTop="16px" />
            <Block width="90%" height="14px" marginTop="6px" />

            {/* Metric cards 2x2 */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Block height="80px" rounded />
              <Block height="80px" rounded />
              <Block height="80px" rounded />
              <Block height="80px" rounded />
            </div>

            {/* Problems */}
            <Block height="88px" marginTop="24px" rounded />
          </div>

          {/* Actions section */}
          <div className="pt-8">
            <Block width="120px" height="9px" />
            <div className="flex gap-2 mt-4">
              <Block width="70px" height="22px" rounded />
              <Block width="70px" height="22px" rounded />
              <Block width="80px" height="22px" rounded />
            </div>
            <Block height="80px" marginTop="12px" />
            <Block height="80px" marginTop="8px" />
            <Block height="80px" marginTop="8px" />
          </div>

          {/* Values section */}
          <div className="pt-8">
            <Block width="100px" height="9px" />
            <Block height="200px" marginTop="16px" rounded />
          </div>
        </main>
      </div>
    </div>
  );
}
