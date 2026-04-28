'use client';

// ProblemsBlock — explains WHY the verdict number looks the way it does.
// Per ux-spec §3.3 there are two problem variants:
//
//   Problem 1 — CERTAIN  (red)    "Your surcharge revenue disappears"
//                                 → shown only when the merchant is surcharging
//   Problem 2 — DEPENDS  (amber)  "A processing cost reduction may not flow through"
//                                 → shown only on flat rate plans
//
// Cat 1 (cost-plus, not surcharging) has no problems — component returns null.
// Cat 2 shows Problem 2 only.
// Cat 3 shows Problem 1 only.
// Cat 4 shows both.
// Cat 5 (zero_cost) shows Problem 3 — full cost exposure starts 1 October.

interface ProblemsBlockProps {
  category: 1 | 2 | 3 | 4 | 5;
  pspName: string;
  surchargeRevenue: number;
  icSaving: number;
  octNet?: number;             // Cat 5 — annual cost from October
  estimatedMSFRate?: number;   // Cat 5 — expected post-reform rate
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-AU')}`;
}

function CertainProblem({ surchargeRevenue }: { surchargeRevenue: number }) {
  return (
    <div
      style={{
        background: '#FDECEA',
        borderLeft: '3px solid #7F1D1D',
        padding: '14px 16px',
        marginBottom: '8px',
      }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="font-medium"
          style={{
            fontSize: '14px',
            color: 'var(--color-text-primary)',
          }}
        >
          Your surcharge revenue disappears
        </h3>
        <span
          className="font-medium uppercase"
          style={{
            background: '#7F1D1D',
            color: '#FFFFFF',
            fontSize: '10px',
            letterSpacing: '1px',
            padding: '2px 7px',
          }}
        >
          Certain
        </span>
      </div>
      <p
        className="mt-2"
        style={{
          fontSize: '12px',
          lineHeight: '1.65',
          color: 'var(--color-text-secondary)',
        }}
      >
        From 1 October, surcharges on Visa, Mastercard, and eftpos become
        illegal. The {formatCurrency(surchargeRevenue)}/year you currently
        recover disappears — regardless of your plan or provider.
      </p>
    </div>
  );
}

function DependsProblem({
  pspName,
  icSaving,
}: {
  pspName: string;
  icSaving: number;
}) {
  return (
    <div
      style={{
        background: '#FEF3E0',
        borderLeft: '3px solid #BA7517',
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="font-medium"
          style={{
            fontSize: '14px',
            color: 'var(--color-text-primary)',
          }}
        >
          A processing cost reduction may or may not flow through
        </h3>
        <span
          className="font-medium uppercase"
          style={{
            background: '#BA7517',
            color: '#FFFFFF',
            fontSize: '10px',
            letterSpacing: '1px',
            padding: '2px 7px',
            whiteSpace: 'nowrap',
            marginLeft: '8px',
          }}
        >
          Depends on your plan
        </span>
      </div>
      <p
        className="mt-2"
        style={{
          fontSize: '12px',
          lineHeight: '1.65',
          color: 'var(--color-text-secondary)',
        }}
      >
        The RBA is cutting wholesale card costs — worth up to{' '}
        {formatCurrency(icSaving)}/year on your volume. On a flat rate plan
        like {pspName}&apos;s default, this saving is bundled inside your
        overall rate. Whether it&apos;s reflected in your rate after October
        depends on whether {pspName} reviews your pricing as part of the
        reform. On an itemised plan, it flows through automatically.
      </p>
    </div>
  );
}

function ZeroCostProblem({
  pspName,
  octNet,
  estimatedMSFRate,
}: {
  pspName: string;
  octNet: number;
  estimatedMSFRate: number;
}) {
  return (
    <div
      style={{
        background: '#FDECEA',
        borderLeft: '3px solid #7F1D1D',
        padding: '14px 16px',
        marginBottom: '8px',
      }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="font-medium"
          style={{
            fontSize: '14px',
            color: 'var(--color-text-primary)',
          }}
        >
          Your zero-cost plan ends on 1 October
        </h3>
        <span
          className="font-medium uppercase"
          style={{
            background: '#7F1D1D',
            color: '#FFFFFF',
            fontSize: '10px',
            letterSpacing: '1px',
            padding: '2px 7px',
          }}
        >
          Certain
        </span>
      </div>
      <p
        className="mt-2"
        style={{
          fontSize: '12px',
          lineHeight: '1.65',
          color: 'var(--color-text-secondary)',
        }}
      >
        From 1 October, the surcharge mechanism that covers your card costs
        becomes illegal on Visa, Mastercard, and eftpos. {pspName} will move
        you to a standard flat-rate plan and you&apos;ll pay for card
        acceptance from your own margin for the first time — approximately{' '}
        {formatCurrency(octNet)}/year at the {(estimatedMSFRate * 100).toFixed(1)}%
        market estimate.
      </p>
    </div>
  );
}

export function ProblemsBlock({
  category,
  pspName,
  surchargeRevenue,
  icSaving,
  octNet,
  estimatedMSFRate,
}: ProblemsBlockProps) {
  // Cat 1 has no problems to flag
  if (category === 1) return null;

  const showCertain = category === 3 || category === 4;
  const showDepends = category === 2 || category === 4;
  const showZeroCost = category === 5;

  return (
    <section
      className="py-6"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
      <p
        className="text-label uppercase"
        style={{
          color: 'var(--color-text-tertiary)',
          marginBottom: '16px',
        }}
      >
        Why this is happening
      </p>

      {showCertain && <CertainProblem surchargeRevenue={surchargeRevenue} />}
      {showDepends && <DependsProblem pspName={pspName} icSaving={icSaving} />}
      {showZeroCost && (
        <ZeroCostProblem
          pspName={pspName}
          octNet={octNet ?? 0}
          estimatedMSFRate={estimatedMSFRate ?? 0.014}
        />
      )}
    </section>
  );
}
