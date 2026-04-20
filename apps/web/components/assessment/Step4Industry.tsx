'use client';

// Step 4: Industry selection.
// CB-06: 3 columns (2 below 500px). SVG icons, not emoji.
// Selected: 1px accent border, #EBF6F3 bg, #0D4A3C text, #1A6B5A icon.

import { AccentButton } from '@/components/ui/AccentButton';
import { TextButton } from '@/components/ui/TextButton';

const INDUSTRIES = [
  {
    id: 'cafe',
    label: 'Cafe / Restaurant',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10h14M3 10V7a4 4 0 014-4h6a4 4 0 014 4v3M3 10v5a2 2 0 002 2h10a2 2 0 002-2v-5" />
        <path d="M17 7h1a2 2 0 010 4h-1" />
      </svg>
    ),
  },
  {
    id: 'hospitality',
    label: 'Hospitality group',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3v5M7 3L5 8M7 3l2 5M5 8h4M7 8v9M13 3v14M13 3l-1.5 5M13 3l1.5 5M3 17h14" />
      </svg>
    ),
  },
  {
    id: 'retail',
    label: 'Retail',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4h10l1 5H4l1-5zM4 9v7a1 1 0 001 1h10a1 1 0 001-1V9" />
        <path d="M8 13h4" />
      </svg>
    ),
  },
  {
    id: 'online',
    label: 'Online store',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="14" height="10" rx="1" />
        <path d="M7 16h6M10 13v3" />
      </svg>
    ),
  },
  {
    id: 'ticketing',
    label: 'Ticketing / Events',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h14v3a2 2 0 100 4v3H3v-3a2 2 0 100-4V5z" />
        <path d="M8 5v10" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'Other',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="14" height="12" rx="1" />
        <path d="M3 9h14M7 5V3M13 5V3" />
      </svg>
    ),
  },
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
      <h2 className="mt-2 font-serif text-heading-lg">What industry are you in?</h2>
      <p className="mt-2 text-body-sm text-gray-500">
        This personalises your action list and average transaction value.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2 max-[500px]:grid-cols-2">
        {INDUSTRIES.map((ind) => {
          const selected = industry === ind.id;
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => onIndustryChange(ind.id)}
              className={`flex flex-col items-center gap-2 rounded-lg p-3.5 text-center
                transition-all duration-150 ${
                  selected
                    ? 'border border-accent bg-accent-light text-accent-dark'
                    : 'border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              style={{ borderWidth: selected ? '1px' : '0.5px' }}
            >
              {/* The icon itself is purely decorative (the label says the
                  industry name) — aria-hidden keeps it out of the a11y tree.
                  text-gray-500 meets 4.5:1 against the white card for sighted
                  users who still scan the icon. */}
              <span aria-hidden className={selected ? 'text-accent' : 'text-gray-500'}>
                {ind.icon}
              </span>
              <span className="text-caption">{ind.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <TextButton onClick={onBack}>Back</TextButton>
        <AccentButton onClick={onNext} disabled={!industry}>
          See my results →
        </AccentButton>
      </div>
    </div>
  );
}
