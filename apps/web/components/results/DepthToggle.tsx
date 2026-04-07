'use client';

// DepthToggle — UI-only progressive-disclosure toggle for the results page
// depth zone (slider, escape scenario, chart, assumptions). Per ux-spec §3.5.
//
// Collapsed by default — the merchant who only wants the verdict + actions
// is never visually overloaded. Expanding reveals the children.
//
// Accessibility:
//   • <button> with aria-expanded reflecting open state
//   • aria-controls points at the panel id
//   • Panel uses role="region" + aria-label

import { useState, useId } from 'react';

interface DepthToggleProps {
  children: React.ReactNode;
  // Optional initial state — default false (collapsed). Tests pass true.
  defaultOpen?: boolean;
}

export function DepthToggle({ children, defaultOpen = false }: DepthToggleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div
      style={{
        marginTop: '8px',
        borderTop: '1px solid var(--color-border-secondary)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center"
        style={{
          gap: '12px',
          padding: '16px 0',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
        }}
      >
        {/* Icon — 24px circle, accent-light bg */}
        <span
          aria-hidden
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: '24px',
            height: '24px',
            background: '#EBF6F3',
            color: '#1A6B5A',
            fontSize: '12px',
            lineHeight: 1,
            transition: 'transform 200ms ease-out',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ↓
        </span>

        {/* Label */}
        <span
          className="font-medium flex-1"
          style={{
            fontSize: '13px',
            color: '#1A6B5A',
          }}
        >
          Understand your numbers
        </span>

        {/* Chevron */}
        <span
          aria-hidden
          style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Panel — only mounted when open so child components don't run when hidden */}
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Detailed cost breakdown"
        >
          {children}
        </div>
      )}
    </div>
  );
}
