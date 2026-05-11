'use client';

// Step 4 — industry, redesigned per ASSESSMENT_STEP4_REDESIGN_BRIEF.md.
// Larger 140×140 (desktop) / 120 (mobile) tiles in a 3-col / 2-col grid.
// Each tile shows a Lucide icon, label, and AVT signal (mono small).
// Selection state matches Step 2/Step 3 vocabulary: 1.5px emerald border
// + emerald-light bg + emerald-dark text/icon.
// AVT figures read from AU_AVG_TXN_BY_INDUSTRY in the calculations package
// to prevent drift from the actual calculation default.
// On selection, an emerald-tinted info note appears below the grid with
// the AVT + an industry-phrase confirmation.

import { Coffee, Building, Store, ShoppingCart, Ticket, MoreHorizontal, Info } from 'lucide-react';
import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';
import { AU_AVG_TXN_BY_INDUSTRY } from '@nosurcharging/calculations/constants/au';

type LucideIcon = typeof Coffee;

interface IndustryTile {
  id: 'cafe' | 'hospitality' | 'retail' | 'online' | 'ticketing' | 'other';
  label: string;
  icon: LucideIcon;
  // Human phrase used in the inline confirmation note ("we'll tune for ___")
  phrase: string;
}

const INDUSTRIES: IndustryTile[] = [
  { id: 'cafe', label: 'Cafe / Restaurant', icon: Coffee, phrase: 'cafés and restaurants' },
  { id: 'hospitality', label: 'Hospitality group', icon: Building, phrase: 'hospitality groups' },
  { id: 'retail', label: 'Retail', icon: Store, phrase: 'retail' },
  { id: 'online', label: 'Online store', icon: ShoppingCart, phrase: 'online retail' },
  { id: 'ticketing', label: 'Ticketing / Events', icon: Ticket, phrase: 'ticketing and events' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, phrase: 'your business' },
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
  const selectedTile = INDUSTRIES.find((i) => i.id === industry);
  const selectedAvt = selectedTile ? AU_AVG_TXN_BY_INDUSTRY[selectedTile.id] : null;

  return (
    <div>
      <p className="text-label tracking-widest text-accent">Step 4</p>
      <h2
        className="mt-2 font-serif text-ink"
        style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 500, lineHeight: 1.18, letterSpacing: '-0.32px' }}
      >
        What industry are you in?
      </h2>
      <p
        className="mt-2 text-ink-secondary"
        style={{ fontSize: 'clamp(13px, 1.4vw, 14px)', lineHeight: 1.55, maxWidth: '580px' }}
      >
        Each industry has different transaction patterns. Tuning for yours
        sharpens both your estimate and your action plan.
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
          const avt = AU_AVG_TXN_BY_INDUSTRY[ind.id];
          return (
            <button
              key={ind.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onIndustryChange(ind.id)}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl text-center transition-all duration-150"
              style={{
                minHeight: 'clamp(120px, 14vw, 140px)',
                padding: 'clamp(18px, 2vw, 22px) clamp(12px, 1.6vw, 18px)',
                gap: '10px',
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
              <span
                className="font-mono"
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.4px',
                  color: selected ? '#0D3D32' : 'var(--color-text-tertiary)',
                }}
              >
                ~${avt} avg
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Inline confirmation note (shown on selection) ───────── */}
      {selectedTile && selectedAvt != null && (
        <div
          className="mt-4 flex items-start rounded-lg"
          style={{
            background: '#EBF6F3',
            padding: '12px 16px',
            gap: '10px',
          }}
        >
          <Info
            size={16}
            strokeWidth={1.6}
            color="#1A6B5A"
            aria-hidden
            className="mt-0.5 flex-shrink-0"
          />
          <p
            style={{
              fontSize: 'clamp(11px, 1.2vw, 12px)',
              lineHeight: 1.55,
              color: '#0D3D32',
            }}
          >
            We&apos;ll use <strong>~${selectedAvt}</strong> as your average
            transaction value and tune action-list language for{' '}
            {selectedTile.phrase}. You can refine the exact figure in your results.
          </p>
        </div>
      )}

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
