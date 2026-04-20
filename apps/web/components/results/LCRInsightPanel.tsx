'use client';

// LCR (Least-Cost Routing) insight panel — flat and blended plans only.
// Shows the potential saving from routing debit transactions via eftpos
// instead of Visa/Mastercard debit networks.
//
// Calculation:
//   eftposRate = $0.02 / avgTransactionValue (flat fee, varies with ATV)
//   lcrDiff = max(0, 0.5% - eftposRate)
//   estimate = volume × 0.55 × lcrDiff

interface LCRInsightPanelProps {
  volume: number;
  pspName: string;
  planType: 'flat' | 'blended';
  avgTransactionValue: number;
}

function formatDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

export function LCRInsightPanel({
  volume,
  pspName,
  planType,
  avgTransactionValue,
}: LCRInsightPanelProps) {
  const EFTPOS_CENTS = 0.02;
  const VISA_DEBIT = 0.005;
  const DEBIT_SHARE = 0.55;

  const eftposRate = EFTPOS_CENTS / avgTransactionValue;
  const lcrDiff = Math.max(0, VISA_DEBIT - eftposRate);
  const estimate = Math.round(volume * DEBIT_SHARE * lcrDiff);

  // Don't show if no saving possible (high ATV → eftpos more expensive)
  if (estimate <= 0) return null;

  return (
    <section
      className="py-5"
      style={{ borderBottom: '1px solid var(--color-border-secondary)' }}
    >
      <p
        className="font-medium uppercase"
        style={{
          fontSize: '11px',
          letterSpacing: '2.5px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '12px',
        }}
      >
        Additional opportunity
      </p>

      <div
        className="rounded-lg p-4"
        style={{ background: '#EBF6F3', border: '1px solid #72C4B0' }}
      >
        <p className="text-body-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Least-Cost Routing could save an additional {formatDollar(estimate)}/year
        </p>
        <p className="mt-2 text-caption" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
          {planType === 'flat' ? 'Your flat rate' : 'Your blended rate'} may not use
          least-cost routing for debit transactions. Routing via eftpos (flat $0.02/txn)
          instead of Visa/Mastercard debit (~0.5%) can reduce costs further — especially
          at your average transaction value of {formatDollar(avgTransactionValue)}.
        </p>
        <p className="mt-2 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          Ask {pspName} whether they support least-cost routing and whether it is
          enabled on your account.
        </p>
      </div>
    </section>
  );
}
