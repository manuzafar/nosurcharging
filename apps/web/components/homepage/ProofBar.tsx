// Homepage proof bar — replaces the previous marquee.
// Sits between nav and hero. Three static credibility statements.
// ux-spec §1.2. Accent-light background, checkmark-circle SVG icons,
// 1px vertical separators at 40% accent-border opacity.

const PROOF_ITEMS = [
  'Independent — no Stripe or Square affiliation',
  'Based on RBA Conclusions Paper, March 2026',
  'Plain English — every term explained',
] as const;

export function ProofBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-accent-border bg-accent-light px-5 py-2">
      {PROOF_ITEMS.map((item, i) => (
        <div key={item} className="flex items-center gap-3">
          {i > 0 && (
            <span
              aria-hidden
              className="hidden h-3 w-px min-[500px]:block"
              style={{ background: 'rgba(114, 196, 176, 0.4)' }}
            />
          )}
          <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-accent">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden
              className="shrink-0"
            >
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M3.5 6L5.2 7.7L8.5 4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}
