'use client';

// CollapsibleSection — Results_V2 redesign wrapper for secondary content
// (templates, negotiation brief, readiness checklist, values & rates).
//
// Visual: top border rule, padded header row, hover background; chevron
// rotates 180deg when expanded. Body padding matches the prototype
// (px-7 desktop / px-4 mobile).
//
// State: per-page-load only. Sections always start in `defaultOpen`
// (false unless caller overrides) and toggle on click. We deliberately
// do NOT persist to localStorage — the design spec calls for "collapsed
// by default" so secondary content stays out of the merchant's way on
// every visit.
//
// Scroll-spy: caller passes `id` (e.g. "checklist") so the existing
// useScrollSpy hook finds the section. The outer <section> carries
// both id="X" and data-section="X" exactly like the legacy sections.

import { forwardRef, useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type IconTint = 'orange' | 'green' | 'blue' | 'purple' | 'fuchsia';

interface CollapsibleSectionProps {
  id: string;
  iconMark: ReactNode;
  iconTint: IconTint;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

const ICON_TINT_BG: Record<IconTint, string> = {
  orange: 'var(--color-background-warning)',
  green: 'var(--color-background-success)',
  blue: '#EFF6FF',
  purple: '#F5F3FF',
  fuchsia: '#FDF4FF',
};

// Icon foreground colours pair with the tint bg above. Each section's
// callsite sets <iconMark> to a Lucide component — the colour is picked
// up via currentColor on the wrapper span.
const ICON_TINT_COLOR: Record<IconTint, string> = {
  orange: 'var(--color-text-warning)',
  green: 'var(--color-text-success)',
  blue: '#1E40AF',
  purple: '#5B21B6',
  fuchsia: '#86198F',
};

export const CollapsibleSection = forwardRef<HTMLElement, CollapsibleSectionProps>(
  function CollapsibleSection(
    {
      id,
      iconMark,
      iconTint,
      title,
      subtitle,
      badge,
      defaultOpen = false,
      children,
    },
    ref,
  ) {
    const [open, setOpen] = useState<boolean>(defaultOpen);
    const headerId = useId();
    const bodyId = useId();

    const handleToggle = () => {
      setOpen((prev) => !prev);
    };

    return (
      <section
        id={id}
        data-section={id}
        ref={ref}
        style={{
          borderTop: '0.5px solid var(--color-border-secondary)',
        }}
      >
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={handleToggle}
          className="w-full flex items-center justify-between text-left transition-colors"
          style={{
            padding: '14px 16px',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-background-secondary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <div className="flex items-center" style={{ gap: '10px' }}>
            <span
              className="flex items-center justify-center shrink-0"
              aria-hidden
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: ICON_TINT_BG[iconTint],
                color: ICON_TINT_COLOR[iconTint],
              }}
            >
              {iconMark}
            </span>
            <div>
              <p
                className="font-bold"
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                }}
              >
                {title}
              </p>
              {subtitle && (
                <p
                  style={{
                    fontSize: '10px',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '1px',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center" style={{ gap: '8px' }}>
            {badge && (
              <span
                className="font-medium"
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: 'var(--color-background-secondary)',
                  color: 'var(--color-text-tertiary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {badge}
              </span>
            )}
            <span
              aria-hidden
              className="flex items-center justify-center transition-transform duration-200"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-tertiary)',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ChevronDown size={14} aria-hidden />
            </span>
          </div>
        </button>

        {open && (
          <div
            id={bodyId}
            role="region"
            aria-labelledby={headerId}
            className="px-4 md:px-7"
            style={{ paddingTop: 0, paddingBottom: '20px' }}
          >
            {children}
          </div>
        )}
      </section>
    );
  },
);
