'use client';

// TensionSection — "what this number doesn't tell you".
//
// Sits between the metric cards and the action plan. Surfaces the
// implicit uncertainty in the centre estimate (which assumes market
// averages) — the things that could move the merchant's actual
// exposure higher or lower than the displayed figure.
//
// Strategic role: convert browsers to the $149 statement-analysis
// upsell by making the gap between "estimate" and "your number"
// explicit. Two ↗ "could be worse" + one ↘ "could be better".
//
// Renders for Cat 3 / Cat 4 / Cat 5 only. Cat 1 + Cat 2 don't have
// material tension to surface — Cat 1 saving is structural, Cat 2
// has its own pass-through framing in the verdict body.

import { TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import type { AssessmentOutputs } from '@nosurcharging/calculations/types';

interface TensionSectionProps {
  category: 1 | 2 | 3 | 4 | 5;
  pspName: string;
  outputs: AssessmentOutputs;
}

function formatCurrency(amount: number): string {
  return `$${Math.round(Math.abs(amount)).toLocaleString('en-AU')}`;
}

interface TensionItem {
  direction: 'bad' | 'good';
  // Bold lead — interpolated with merchant context (psp, etc).
  lead: string;
  // Body — non-bold, completes the sentence.
  body: string;
}

function buildItems(
  category: 1 | 2 | 3 | 4 | 5,
  pspName: string,
): TensionItem[] {
  if (category === 3 || category === 4) {
    return [
      {
        direction: 'bad',
        lead: `If ${pspName} passes through less than 45% of their interchange saving,`,
        body: 'your actual October cost is higher than shown. The 45% is a market assumption — your contract may differ.',
      },
      {
        direction: 'bad',
        lead: 'If your card mix skews toward credit or corporate cards,',
        body: "your interchange saving is smaller. We've used a retail average — yours may be materially different.",
      },
      {
        direction: 'good',
        lead: 'There is still a negotiation window.',
        body: `${pspName} is fielding calls now. Merchants who call before August are getting better transition rates than those who wait.`,
      },
    ];
  }

  // Cat 5 — zero-cost. No "items" — single body paragraph below.
  // We still render an empty array; the body paragraph stands alone.
  return [];
}

function getBody(
  category: 1 | 2 | 3 | 4 | 5,
  pspName: string,
  outputs: AssessmentOutputs,
): string {
  const exposure = formatCurrency(outputs.plSwing);

  if (category === 3 || category === 4) {
    return `−${exposure} is an estimate based on market averages. Three things could make your actual exposure significantly worse — and one could make it better. We cannot know which applies to your business without your merchant statement.`;
  }

  if (category === 5) {
    return `−${exposure} is estimated using a 1.4% market rate. Your actual post-reform rate depends entirely on what ${pspName} moves you to. We cannot calculate your real exposure without seeing your new plan in writing.`;
  }

  // Defensive — Cat 1 / Cat 2 don't render this section, but keep
  // a sensible string in case the gating fails.
  return `Your estimate is based on industry-average card mix. We cannot calculate your real exposure without your merchant statement.`;
}

export function TensionSection({
  category,
  pspName,
  outputs,
}: TensionSectionProps) {
  // Gating — Cat 1 / Cat 2 don't have material tension to surface.
  if (category === 1 || category === 2) return null;

  const items = buildItems(category, pspName);
  const body = getBody(category, pspName, outputs);

  return (
    <section
      className="mt-4 px-4 py-4 md:px-7 md:py-5"
      style={{
        background: 'var(--color-background-secondary)',
        borderTop: '0.5px solid var(--color-border-secondary)',
        borderBottom: '0.5px solid var(--color-border-secondary)',
      }}
      aria-label="What this number does not tell you"
    >
      {/* Header row — amber circled exclamation + title */}
      <div className="flex items-center gap-2.5" style={{ marginBottom: '12px' }}>
        <span
          className="flex items-center justify-center shrink-0"
          aria-hidden
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'var(--color-background-warning)',
            border: '0.5px solid var(--color-text-warning)',
            color: 'var(--color-text-warning)',
          }}
        >
          <TriangleAlert size={13} aria-hidden />
        </span>
        <h3
          className="font-bold"
          style={{
            fontSize: '14px',
            color: 'var(--color-text-primary)',
            lineHeight: 1.35,
          }}
        >
          Here is what this number does not tell you.
        </h3>
      </div>

      {/* Body paragraph */}
      <p
        style={{
          fontSize: '12.5px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.75,
          maxWidth: '620px',
          marginBottom: items.length > 0 ? '14px' : 0,
        }}
      >
        {body}
      </p>

      {/* Tension items */}
      {items.length > 0 && (
        <div
          className="flex flex-col gap-2.5"
          style={{ maxWidth: '620px' }}
        >
          {items.map((item, i) => {
            const isGood = item.direction === 'good';
            return (
              <div
                key={i}
                className="flex items-start gap-2.5"
              >
                <span
                  className="flex items-center justify-center shrink-0"
                  aria-hidden
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isGood
                      ? 'var(--color-background-success)'
                      : 'var(--color-background-danger)',
                    color: isGood
                      ? 'var(--color-text-success)'
                      : 'var(--color-text-danger)',
                    marginTop: '2px',
                  }}
                >
                  {isGood ? (
                    <TrendingDown size={10} aria-hidden />
                  ) : (
                    <TrendingUp size={10} aria-hidden />
                  )}
                </span>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.65,
                    flex: 1,
                  }}
                >
                  <strong
                    style={{
                      color: 'var(--color-text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {item.lead}
                  </strong>{' '}
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
