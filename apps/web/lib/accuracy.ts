import type { ResolutionTrace } from '@nosurcharging/calculations/types';

interface EditState {
  avgTransactionValue?: number;
  creditPct?: number;
  commercialShare?: number;
  monthlyDebitTxns?: number;
  minMonthlyFee?: number;
}

// Accuracy score: base 20; +25 AVT; +25 credit; +15 commercial; +15 monthly txns.
export function computeAccuracy(
  trace: ResolutionTrace,
  edits?: EditState,
): number {
  let score = 20;

  const hasUserSource = (key: string) => {
    const s = trace[key]?.source;
    return s === 'merchant_input' || s === 'invoice_parsed';
  };

  if ((edits?.avgTransactionValue !== undefined) || hasUserSource('avgTransactionValue')) {
    score += 25;
  }
  if ((edits?.creditPct !== undefined) || hasUserSource('expertRates.creditPct')) {
    score += 25;
  }
  if (
    (edits?.commercialShare !== undefined) ||
    hasUserSource('cardMix.visa_credit') ||
    hasUserSource('cardMix.mastercard_credit')
  ) {
    score += 15;
  }
  if (edits?.monthlyDebitTxns !== undefined) {
    score += 15;
  }

  return Math.min(100, score);
}
