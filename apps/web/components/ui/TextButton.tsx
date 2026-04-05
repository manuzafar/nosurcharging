'use client';

// Secondary text button. Used for Back navigation and text links.
// No background, no border — just text with hover underline.

interface TextButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TextButton({ children, onClick, className = '' }: TextButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-body-sm text-gray-500 hover:text-gray-700
        transition-colors duration-100 ${className}`}
    >
      {children}
    </button>
  );
}
