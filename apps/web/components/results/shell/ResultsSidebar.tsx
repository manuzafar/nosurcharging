'use client';

import type { SectionId, SectionMeta } from './types';
import { SECTIONS } from './types';

interface ResultsSidebarProps {
  activeSection: SectionId;
  onNavClick: (id: SectionId) => void;
  urgentCount: number;
  category: 1 | 2 | 3 | 4 | 5;
}

const GROUP_LABELS: Record<SectionMeta['group'], string> = {
  result: 'Result',
  prepare: 'Prepare',
  community: 'Community',
  understand: 'Understand',
  next: 'Next step',
};

const CTA_PRICE: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '$2,500',
  2: '$2,500',
  3: '$3,500',
  4: '$3,500',
  5: '$3,500', // Cat 5: full plan transition + repricing — same complexity tier as Cat 3/4
};

export function ResultsSidebar({
  activeSection,
  onNavClick,
  urgentCount,
  category,
}: ResultsSidebarProps) {
  let currentGroup: SectionMeta['group'] | null = null;

  return (
    <nav
      className="hidden md:flex flex-col shrink-0 overflow-y-auto"
      style={{
        width: '200px',
        position: 'sticky',
        top: '44px',
        height: 'calc(100vh - 44px)',
        background: '#F0EBE3',
        borderRight: '1.5px solid #C8C0B4',
      }}
      aria-label="Results sections"
    >
      <div className="pt-6 pb-4 px-4">
        {SECTIONS.map((section, i) => {
          const showGroupLabel = section.group !== currentGroup;
          if (showGroupLabel) currentGroup = section.group;
          const isActive = activeSection === section.id;
          const isFirstGroup = i === 0 || (showGroupLabel && currentGroup === 'result');

          return (
            <div key={section.id}>
              {showGroupLabel && !isFirstGroup && (
                <div
                  data-testid="sidebar-divider"
                  style={{
                    height: '1px',
                    background: 'var(--color-border-rule)',
                    margin: '14px 10px',
                  }}
                />
              )}
              {showGroupLabel && (
                <p
                  className="uppercase tracking-widest mb-1.5"
                  style={{
                    color: 'var(--color-text-tertiary)',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '1.5px',
                    marginTop: isFirstGroup ? 0 : '0',
                    paddingLeft: '10px',
                  }}
                >
                  {GROUP_LABELS[section.group]}
                </p>
              )}
              <button
                type="button"
                onClick={() => onNavClick(section.id)}
                className="flex items-center justify-between w-full text-left cursor-pointer"
                style={{
                  background: isActive ? 'var(--color-accent-light)' : 'transparent',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                  padding: '6px 10px',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: '13px',
                  lineHeight: '1.4',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                <span className="flex-1">
                  {section.label}
                  {section.sublabel && (
                    <span
                      className="block"
                      style={{
                        fontSize: '11px',
                        fontWeight: 400,
                        color: 'var(--color-text-tertiary)',
                        marginTop: '1px',
                      }}
                    >
                      {section.sublabel}
                    </span>
                  )}
                </span>
                {section.id === 'actions' && urgentCount > 0 && (
                  <span
                    className="font-medium rounded-pill"
                    style={{
                      background: 'var(--color-background-danger)',
                      color: 'var(--color-text-danger)',
                      fontSize: '11px',
                      padding: '2px 7px',
                    }}
                  >
                    {urgentCount}
                  </span>
                )}
                {section.id === 'help' && (
                  <span
                    className="font-medium rounded-pill"
                    style={{
                      background: '#EBF6F3',
                      color: 'var(--color-accent)',
                      fontSize: '11px',
                      padding: '2px 7px',
                    }}
                  >
                    {CTA_PRICE[category]}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
