'use client';

// Pill badge — used for category pills, confidence chips, urgency labels.
// 11px, 4px 12px padding, 20px border-radius.
// Variants: accent, green, red, grey.

type PillVariant = 'accent' | 'green' | 'red' | 'grey';

interface PillBadgeProps {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}

const variantStyles: Record<PillVariant, React.CSSProperties> = {
  accent: {
    background: '#EBF6F3',
    color: '#0D4A3C',
  },
  green: {
    background: 'var(--color-background-success)',
    color: 'var(--color-text-success)',
  },
  red: {
    background: 'var(--color-background-danger)',
    color: 'var(--color-text-danger)',
  },
  grey: {
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-secondary)',
  },
};

export function PillBadge({ children, variant = 'accent', className = '' }: PillBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1
        text-label font-medium ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
