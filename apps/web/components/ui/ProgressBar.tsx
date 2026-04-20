'use client';

// 4-segment progress line. Completed and active = accent. Inactive = grey.
// Design: 2px height, 4px gap, border-radius 1px.

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export function ProgressBar({ currentStep, totalSteps = 4 }: ProgressBarProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={`h-0.5 flex-1 rounded-sm transition-colors duration-150 ${
            i < currentStep ? 'bg-accent' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}
