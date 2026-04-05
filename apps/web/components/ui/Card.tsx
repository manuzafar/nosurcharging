'use client';

// Base card component with selected state.
// Unselected: 0.5px border-secondary. Selected: 1px amber border.
// No background change on selection — border weight communicates selection.
// Transition: 150ms ease on border.

interface CardProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  role?: string;
  ariaChecked?: boolean;
  ariaLabel?: string;
}

export function Card({
  children,
  selected = false,
  onClick,
  className = '',
  role,
  ariaChecked,
  ariaLabel,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      role={role}
      aria-checked={ariaChecked}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`rounded-xl p-4 transition-all duration-150 ease-out
        ${
          selected
            ? 'border border-amber-400'
            : 'border border-gray-200'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}`}
      style={{ borderWidth: selected ? '1px' : '0.5px' }}
    >
      {children}
    </div>
  );
}
