'use client';

// Primary CTA button. Amber filled: bg #BA7517, text #FAEEDA.
// Disabled state: 30% opacity.

interface AmberButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function AmberButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: AmberButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg bg-amber-400 px-8 py-3 text-body font-medium text-amber-50
        transition-opacity duration-150 hover:opacity-90
        disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
