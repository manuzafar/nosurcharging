'use client';

// Step counter: "01 / 04" — current number in amber mono.
// Font: var(--font-mono), 13px.

interface StepCounterProps {
  current: number;
  total?: number;
}

export function StepCounter({ current, total = 4 }: StepCounterProps) {
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <span className="font-mono text-body-sm text-gray-400 whitespace-nowrap">
      <span className="text-amber-400">{pad(current)}</span>
      {' / '}
      {pad(total)}
    </span>
  );
}
