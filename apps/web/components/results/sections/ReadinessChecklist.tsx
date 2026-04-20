'use client';

import { forwardRef, useState } from 'react';

interface ReadinessChecklistProps {
  category: 1 | 2 | 3 | 4;
  pspName: string;
}

interface ChecklistItem {
  label: string;
  deadline: string;
}

function getItems(category: 1 | 2 | 3 | 4, pspName: string): ChecklistItem[] {
  if (category === 3 || category === 4) {
    return [
      { label: `Contact ${pspName} about rate changes`, deadline: 'By 30 Jun 2026' },
      { label: 'Decide on repricing strategy', deadline: 'By 31 Jul 2026' },
      { label: 'Send customer communications', deadline: 'By 31 Aug 2026' },
      { label: 'Update POS/terminal surcharge settings', deadline: 'By 30 Sep 2026' },
      { label: 'Check first post-reform statement', deadline: 'By 30 Nov 2026' },
    ];
  }
  return [
    { label: `Confirm IC pass-through with ${pspName}`, deadline: 'By 30 Sep 2026' },
    { label: 'Check first post-reform statement', deadline: 'By 30 Nov 2026' },
    { label: 'Review MSF benchmark (published 30 Oct)', deadline: 'By 30 Nov 2026' },
    { label: 'Review RBA compliance report', deadline: 'By 28 Feb 2027' },
  ];
}

export const ReadinessChecklist = forwardRef<HTMLElement, ReadinessChecklistProps>(
  function ReadinessChecklist({ category, pspName }, ref) {
    const items = getItems(category, pspName);
    const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));

    const completedCount = checked.filter(Boolean).length;
    const progressPct = items.length > 0 ? (completedCount / items.length) * 100 : 0;

    const handleToggle = (index: number) => {
      setChecked((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    };

    return (
      <section id="checklist" data-section="checklist" ref={ref} className="pt-8">
        <p
          className="text-micro uppercase tracking-widest pb-3 mb-6"
          style={{
            color: 'var(--color-text-tertiary)',
            letterSpacing: '1.5px',
            fontSize: '11px',
            borderBottom: '1px solid var(--color-border-secondary)',
          }}
        >
          Readiness checklist
        </p>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Progress
            </span>
            <span className="font-mono" style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
              {completedCount}/{items.length}
            </span>
          </div>
          <div
            style={{
              height: '7px',
              borderRadius: '9999px',
              background: 'var(--color-bg-secondary, #F5F3EF)',
              overflow: 'hidden',
            }}
          >
            <div
              data-testid="progress-fill"
              style={{
                height: '100%',
                borderRadius: '9999px',
                background: 'var(--color-accent)',
                width: `${progressPct}%`,
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <label
              key={item.label}
              className="flex items-start gap-3 cursor-pointer rounded-lg p-3"
              style={{
                background: checked[i] ? '#F0FAF6' : 'var(--color-bg-secondary, #F5F3EF)',
                border: '1px solid ' + (checked[i] ? '#C6E7D9' : 'var(--color-border-secondary)'),
                transition: 'background 150ms ease, border 150ms ease',
              }}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => handleToggle(i)}
                className="mt-0.5 accent-amber-600"
                style={{ width: '16px', height: '16px' }}
              />
              <div className="flex-1">
                <span
                  style={{
                    fontSize: '13px',
                    color: checked[i] ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                    textDecoration: checked[i] ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="font-mono block mt-1"
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {item.deadline}
                </span>
              </div>
            </label>
          ))}
        </div>
      </section>
    );
  },
);
