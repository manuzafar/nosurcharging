'use client';

// Step 4 — industry, simplified per ASSESSMENT_STEP4_SIMPLIFICATION_BRIEF.
// 6 tiles in a 3×2 desktop / 2×3 mobile grid. Each tile shows ONLY the
// industry icon + name. Selection state matches Step 2/3 vocabulary: 1.5px
// emerald border + emerald-light bg + emerald-filled icon square.
//
// May 2026 simplification: the per-tile AVT figure (~$XX avg) and the
// post-selection confirmation banner were removed. Both added cognitive
// overhead without changing the decision a merchant makes — they pick
// based on what their business is, not on a default-figure preview. The
// AVT calculation continues server-side from AU_AVG_TXN_BY_INDUSTRY; the
// merchant just doesn't see the figure on this step.

import { Coffee, Building, Store, ShoppingCart, Ticket, MoreHorizontal } from 'lucide-react';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';

type LucideIcon = typeof Coffee;

interface IndustryTile {
  id: 'cafe' | 'hospitality' | 'retail' | 'online' | 'ticketing' | 'other';
  label: string;
  icon: LucideIcon;
}

const INDUSTRIES: IndustryTile[] = [
  { id: 'cafe', label: 'Cafe / Restaurant', icon: Coffee },
  { id: 'hospitality', label: 'Hospitality group', icon: Building },
  { id: 'retail', label: 'Retail', icon: Store },
  { id: 'online', label: 'Online store', icon: ShoppingCart },
  { id: 'ticketing', label: 'Ticketing / Events', icon: Ticket },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
];

interface Step4IndustryProps {
  industry: string | null;
  onIndustryChange: (industry: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Industry({
  industry,
  onIndustryChange,
  onNext,
  onBack,
}: Step4IndustryProps) {
  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 4</p>
      <h2
        className="mt-2 font-serif text-ink"
        style={{
          fontSize: 'clamp(24px, 4vw, 32px)',
          fontWeight: 500,
          lineHeight: 1.18,
          letterSpacing: '-0.32px',
        }}
      >
        What industry are you in?
      </h2>
      <p
        className="mt-2 text-ink-secondary"
        style={{
          fontSize: 'clamp(13px, 1.4vw, 14px)',
          lineHeight: 1.55,
          maxWidth: '580px',
        }}
      >
        Tuning to your industry sharpens your estimate and your action plan.
      </p>

      {/* ── Industry tile grid ──────────────────────────────────── */}
      <div
        role="radiogroup"
        aria-label="Industry"
        className="mt-6 grid grid-cols-2 sm:grid-cols-3"
        style={{ gap: '12px' }}
      >
        {INDUSTRIES.map((ind) => {
          const selected = industry === ind.id;
          return (
            <button
              key={ind.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onIndustryChange(ind.id)}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl text-center transition-all duration-150"
              style={{
                // Tighter than v1 — the removed AVT line freed vertical
                // space, so the tile reads as a clean icon+name unit.
                minHeight: 'clamp(116px, 14vw, 130px)',
                padding: 'clamp(22px, 2.4vw, 24px) clamp(12px, 1.4vw, 16px)',
                gap: 'clamp(12px, 1.4vw, 14px)',
                border: selected
                  ? '1.5px solid #1A6B5A'
                  : '1px solid var(--color-border-tertiary)',
                background: selected ? '#EBF6F3' : 'var(--color-background-primary)',
              }}
            >
              <span
                aria-hidden
                className="flex items-center justify-center"
                style={{
                  width: 'clamp(32px, 4vw, 36px)',
                  height: 'clamp(32px, 4vw, 36px)',
                  borderRadius: '8px',
                  background: selected ? '#1A6B5A' : 'var(--color-background-secondary)',
                  color: selected ? '#fff' : '#6B6253',
                }}
              >
                <ind.icon size={20} strokeWidth={1.6} />
              </span>
              <span
                className="font-medium"
                style={{
                  fontSize: 'clamp(13px, 1.4vw, 14px)',
                  lineHeight: 1.3,
                  color: selected ? '#0D3D32' : 'var(--color-text-primary)',
                }}
              >
                {ind.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={onNext} disabled={!industry}>
          See my results →
        </AccentButton>
      </div>
    </div>
  );
}
