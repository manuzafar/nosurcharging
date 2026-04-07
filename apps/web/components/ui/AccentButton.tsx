'use client';

// Primary CTA button. Accent filled: bg #1A6B5A, text #EBF6F3.
// Disabled state: 30% opacity.

interface AccentButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function AccentButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: AccentButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg bg-accent px-8 py-3 text-body font-medium text-accent-light
        transition-opacity duration-150 hover:opacity-90
        disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
