'use client';

// Primary CTA button. Accent filled: bg #1A6B5A, text #EBF6F3.
// Disabled state: 30% opacity.
//
// Shape: fully-rounded pill (rounded-full). The pill is reserved — there is
// exactly one pill CTA per screen, and that's this component. It signals
// "THE action on this screen" against the 8px rectangles used for secondary
// buttons, inputs, and selection cards. See corner-radius system notes in
// tailwind.config.ts.

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
      className={`rounded-full bg-accent px-8 py-3 text-body font-medium text-accent-light
        transition-opacity duration-150 hover:opacity-90
        disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
