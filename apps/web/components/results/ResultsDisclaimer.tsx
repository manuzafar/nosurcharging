'use client';

// FR-22: Results page inline disclaimer.
// Exact wording from docs/legal/disclaimer-text.md — do not paraphrase.
// 11px, --color-text-secondary, text-align center.

export function ResultsDisclaimer() {
  return (
    <p
      className="text-center"
      style={{
        fontSize: '11px',
        lineHeight: '1.5',
        color: 'var(--color-text-secondary)',
      }}
    >
      Figures are illustrative estimates based on RBA data and the information you provided.
      Not financial advice. Verify with your PSP before making business decisions. Card mix
      defaults are based on RBA Statistical Tables C1 and C2 (national averages) and may not
      reflect your specific business.
    </p>
  );
}
