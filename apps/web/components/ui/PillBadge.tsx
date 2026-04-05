'use client';

// Pill badge — used for category pills, confidence chips, urgency labels.
// 11px, 4px 12px padding, 20px border-radius.
// Variants: amber, green, red, grey.

type PillVariant = 'amber' | 'green' | 'red' | 'grey';

interface PillBadgeProps {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  amber: 'bg-amber-50 text-amber-800',
  green: 'bg-green-50 text-green-800',
  red: 'bg-red-50 text-red-800',
  grey: 'bg-gray-100 text-gray-600',
};

export function PillBadge({ children, variant = 'amber', className = '' }: PillBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3 py-1
        text-label font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
