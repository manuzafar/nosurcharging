// MarketBenchmarkSentence — single editorial paragraph that pins
// three numbers side-by-side: the merchant's effective MSF, the
// PSP's published list rate (if any), and the post-reform wholesale
// floor. Per RESULTS_CONTENT_CREDIBILITY_BRIEF.md Section 3.3.
//
// Four locked copy variants:
//   above_list      — merchant pays more than the PSP's own list price
//   at_list         — within ±5bps of list
//   below_list      — already below list
//   no_list_anchor  — bank acquirer or Adyen (no meaningful list rate)
//
// Cat 5 suppression happens at the mount point; this component
// renders defensively regardless.

import { Scale } from 'lucide-react';
import type { BenchmarkComparison } from '@nosurcharging/calculations/types';
import { displayPspName } from '@nosurcharging/calculations';

interface MarketBenchmarkSentenceProps {
  comparison: BenchmarkComparison;
  pspName: string;
}

function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatBps(rate: number): string {
  return `${Math.round(Math.abs(rate) * 10000)}bps`;
}

function formatCurrency(amount: number): string {
  return `$${Math.round(Math.abs(amount)).toLocaleString('en-AU')}`;
}

export function MarketBenchmarkSentence({
  comparison,
  pspName,
}: MarketBenchmarkSentenceProps) {
  const displayName = displayPspName(pspName);
  const { merchantRate, pspListRate, postReformFloor, comparison: variant, potentialAnnualSaving } = comparison;
  const merchantMargin = Math.max(0, merchantRate - postReformFloor);

  return (
    <section
      className="flex items-start px-5 md:px-8"
      style={{ gap: '12px', maxWidth: '680px' }}
    >
      <Scale
        size={18}
        strokeWidth={1.6}
        color="var(--color-text-secondary)"
        aria-hidden
        className="mt-1 flex-shrink-0"
      />
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.7,
          color: 'var(--color-text-secondary)',
        }}
      >
        {variant === 'above_list' && pspListRate !== null && (
          <>
            You pay <strong>{formatPct(merchantRate)}</strong>. {displayName}&apos;s
            published flat rate for your plan is{' '}
            <strong>{formatPct(pspListRate)}</strong> — you&apos;re{' '}
            <strong>
              {formatBps(merchantRate - pspListRate)} above their own list
              price
            </strong>
            . The post-reform wholesale floor for your card mix is
            approximately <strong>{formatPct(postReformFloor)}</strong>;
            closing the gap to list rate alone is worth around{' '}
            <strong>{formatCurrency(potentialAnnualSaving)}/year</strong>.
          </>
        )}
        {variant === 'at_list' && pspListRate !== null && (
          <>
            You pay <strong>{formatPct(merchantRate)}</strong> — in line with{' '}
            {displayName}&apos;s published flat rate of{' '}
            <strong>{formatPct(pspListRate)}</strong>. The post-reform
            wholesale floor for your card mix is approximately{' '}
            <strong>{formatPct(postReformFloor)}</strong>, meaning roughly{' '}
            <strong>{formatPct(merchantMargin)}</strong> of what you pay is{' '}
            {displayName}&apos;s gross margin on your account.
          </>
        )}
        {variant === 'below_list' && pspListRate !== null && (
          <>
            You pay <strong>{formatPct(merchantRate)}</strong> — already below{' '}
            {displayName}&apos;s published flat rate of{' '}
            <strong>{formatPct(pspListRate)}</strong>. The post-reform
            wholesale floor for your card mix is approximately{' '}
            <strong>{formatPct(postReformFloor)}</strong>; the structural
            floor for negotiation is the gap between those numbers.
          </>
        )}
        {variant === 'no_list_anchor' && (
          <>
            You pay <strong>{formatPct(merchantRate)}</strong>. {displayName} does
            not publish a meaningful list rate — bank-acquirer pricing is
            negotiated. The post-reform wholesale floor for your card mix
            is approximately <strong>{formatPct(postReformFloor)}</strong>,
            meaning roughly <strong>{formatPct(merchantMargin)}</strong> of
            what you pay is {displayName}&apos;s gross margin.
          </>
        )}
      </p>
    </section>
  );
}
