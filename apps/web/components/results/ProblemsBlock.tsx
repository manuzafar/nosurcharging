'use client';

// ProblemsBlock — explains WHY the verdict number looks the way it does.
// Per the Results_V2 redesign:
//   - Side-by-side 2-col layout on md+ (single col mobile)
//   - Icon-led card style (32x32 icon box + content)
//   - Tinted bg + soft same-tone border (no left-border rule)
//   - Compact: 12px name, 8px tag, 11.5px body
//
// Variants (unchanged from before):
//   CERTAIN  → red    "Surcharge ban applies" (Cat 3, 4)
//   DEPENDS  → amber  "Interchange saving uncertain" (Cat 2, 4)
//   CERTAIN  → red    "Your zero-cost plan ends" (Cat 5)
//
// Cat 1 (cost-plus, not surcharging): null — nothing to flag.

import { Ban, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

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

interface ProblemCardProps {
  variant: 'certain' | 'depends';
  iconMark: ReactNode;          // Lucide icon component
  name: string;                 // 12px bold
  tag: string;                  // "CERTAIN" / "DEPENDS ON PLAN"
  body: React.ReactNode;
}

function ProblemCard({ variant, iconMark, name, tag, body }: ProblemCardProps) {
  // Variant tokens — light bg, soft same-tone border, solid tag pill.
  const styles =
    variant === 'certain'
      ? {
          bg: 'var(--color-background-danger)',
          border: 'rgba(121, 31, 31, 0.15)',
          iconBg: 'rgba(121, 31, 31, 0.12)',
          iconColor: 'var(--color-text-danger)',
          tagBg: 'var(--color-text-danger)',
          tagColor: '#FFFFFF',
        }
      : {
          bg: 'var(--color-background-warning)',
          border: 'rgba(186, 117, 23, 0.15)',
          iconBg: 'rgba(186, 117, 23, 0.12)',
          iconColor: 'var(--color-text-warning)',
          tagBg: 'var(--color-text-warning)',
          tagColor: '#FFFFFF',
        };

  return (
    <div
      className="flex gap-3 items-start"
      style={{
        background: styles.bg,
        border: `0.5px solid ${styles.border}`,
        borderRadius: '10px',
        padding: '14px 16px',
      }}
    >
      {/* Icon mark */}
      <span
        className="flex items-center justify-center shrink-0"
        aria-hidden
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: styles.iconBg,
          color: styles.iconColor,
        }}
      >
        {iconMark}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-1.5 flex-wrap"
          style={{ marginBottom: '4px' }}
        >
          <h3
            className="font-bold"
            style={{
              fontSize: '12px',
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
            }}
          >
            {name}
          </h3>
          <span
            className="uppercase font-bold"
            style={{
              fontSize: '8px',
              letterSpacing: '0.3px',
              padding: '1px 6px',
              borderRadius: '3px',
              background: styles.tagBg,
              color: styles.tagColor,
              whiteSpace: 'nowrap',
            }}
          >
            {tag}
          </span>
        </div>
        <p
          style={{
            fontSize: '11.5px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
          }}
        >
          {body}
        </p>
      </div>
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

  // Eyebrow ("Why this is happening") moved out to page-level
  // SectionHeader. ProblemsBlock now renders only the card grid.
  return (
    <section>
      <div className="grid grid-cols-1 min-[501px]:grid-cols-2 gap-2.5">
        {showCertain && (
          <ProblemCard
            variant="certain"
            iconMark={<Ban size={16} aria-hidden />}
            name="Surcharge ban applies"
            tag="CERTAIN"
            body={
              <>
                From 1 October, surcharges on Visa, Mastercard and eftpos
                become illegal. The {formatCurrency(surchargeRevenue)}/year you
                currently recover disappears regardless of plan or provider.
              </>
            }
          />
        )}
        {showDepends && (
          <ProblemCard
            variant="depends"
            iconMark={<Zap size={16} aria-hidden />}
            name="Interchange saving uncertain"
            tag="DEPENDS ON PLAN"
            body={
              <>
                The RBA is cutting wholesale costs by{' '}
                {formatCurrency(icSaving)}/year. On {pspName}&apos;s flat
                rate, whether this reaches you depends on whether {pspName}{' '}
                reviews your pricing as part of the reform.
              </>
            }
          />
        )}
        {showZeroCost && (
          <ProblemCard
            variant="certain"
            iconMark={<Ban size={16} aria-hidden />}
            name="Your zero-cost plan ends"
            tag="CERTAIN"
            body={
              <>
                From 1 October, the surcharge mechanism that covers your card
                costs becomes illegal on Visa, Mastercard, and eftpos.{' '}
                {pspName} will likely need to move you to a standard
                flat-rate plan, and you&apos;ll pay for card acceptance from
                your own margin for the first time — approximately{' '}
                {formatCurrency(octNet ?? 0)}/year at the{' '}
                {((estimatedMSFRate ?? 0.014) * 100).toFixed(1)}% market
                estimate. Confirm the transfer plan with {pspName} this week.
              </>
            }
          />
        )}
      </div>
    </section>
  );
}
