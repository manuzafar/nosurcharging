'use client';

import type { SectionId } from './types';
import { SECTIONS } from './types';

interface MobileMiniNavProps {
  activeSection: SectionId;
  onNavClick: (id: SectionId) => void;
  plSwing: number;
}

function formatSignedDollar(value: number): string {
  if (value === 0) return '$0';
  return (value > 0 ? '+' : '−') + '$' + Math.abs(Math.round(value)).toLocaleString('en-AU');
}

export function MobileMiniNav({ activeSection, onNavClick, plSwing }: MobileMiniNavProps) {
  const isPositive = plSwing >= 0;

  return (
    <div
      className="md:hidden sticky z-40 flex items-center gap-2 px-3 border-b border-rule bg-paper-white"
      style={{ top: '44px', height: '40px' }}
    >
      {/* Fixed P&L anchor */}
      <span
        className="font-mono text-xs shrink-0"
        style={{
          color: isPositive ? 'var(--color-text-success)' : 'var(--color-text-danger)',
          minWidth: '60px',
        }}
      >
        {formatSignedDollar(plSwing)}
      </span>

      {/* Horizontal tabs */}
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavClick(section.id)}
                className="shrink-0 rounded-pill cursor-pointer whitespace-nowrap"
                style={{
                  fontSize: '11px',
                  padding: '4px 12px',
                  border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border-secondary)',
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                }}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
