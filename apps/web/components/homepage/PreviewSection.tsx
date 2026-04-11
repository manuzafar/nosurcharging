// Homepage situations preview — replaces the legacy 4-tab rotating cards.
// Static 2x2 grid of illustrative outcomes. ux-spec §1.5.
//
// Numbers and copy are illustrative ONLY — they do not come from the
// calculation engine. Each card represents one of the four possible
// merchant situations so visitors can self-identify before clicking
// the CTA.
//
// Naming: file is still PreviewSection.tsx (per change-plan §G) but
// the section is internally referred to as the "situations preview".
// The label uses "SITUATION N" — never "Category N" — on the homepage.

interface Situation {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  amount: string;
  amountColour: 'positive' | 'negative' | 'neutral';
  amountNote?: string;
  action: string;
}

const SITUATIONS: Situation[] = [
  {
    number: 1,
    title: "You don't surcharge — costs itemised",
    description:
      'Your costs fall automatically in October. Best position.',
    amount: '+$1,725/yr',
    amountColour: 'positive',
    action: 'Confirm the saving flows through automatically',
  },
  {
    number: 2,
    title: "You don't surcharge — one flat rate",
    description:
      'Saving possible — depends on whether your rate is reviewed.',
    amount: '$0–+$1,725/yr',
    amountColour: 'neutral',
    action:
      'Ask your payment provider whether your rate adjusts after October',
  },
  {
    number: 3,
    title: 'You surcharge — costs itemised',
    description:
      'Surcharge revenue disappears 1 October. Reprice now.',
    amount: '−$111,377/yr',
    amountColour: 'negative',
    amountNote: 'example: $10M volume',
    action: 'Calculate your repricing gap before October',
  },
  {
    number: 4,
    title: 'You surcharge — one flat rate',
    description:
      'Two problems at once. Act on both this week.',
    amount: '−$34,836/yr',
    amountColour: 'negative',
    amountNote: 'example: $3M volume',
    action: 'Act on both fronts before end of April',
  },
];

const AMOUNT_COLOURS: Record<Situation['amountColour'], string> = {
  positive: '#166534', // green
  negative: '#7F1D1D', // red
  neutral: '#6B5E4A', // ink-muted
};

export function PreviewSection() {
  return (
    <section className="border-b border-rule bg-paper px-5 py-12">
      <div className="mx-auto max-w-results">
        {/* Eyebrow label */}
        <p className="text-center text-[10px] font-medium uppercase tracking-[2.5px] text-ink-faint">
          Which situation are you in?
        </p>

        {/* Section heading */}
        <h2 className="mt-3 text-center font-serif text-[22px] font-medium leading-tight text-ink">
          Four types of merchant. Find yours.
        </h2>

        {/* 2x2 grid — 1px gap effect via rule-coloured container background */}
        <div
          className="mx-auto mt-8 grid max-w-[560px] grid-cols-2 max-[500px]:grid-cols-1"
          style={{
            gap: '1px',
            background: '#DDD5C8', // rule
            border: '1px solid #DDD5C8',
          }}
        >
          {SITUATIONS.map((s) => (
            <article
              key={s.number}
              className="bg-paper-white p-5"
              aria-labelledby={`situation-${s.number}-title`}
            >
              {/* Situation number label */}
              <p className="text-[9px] font-medium uppercase tracking-[2px] text-ink-faint">
                Situation {s.number}
              </p>

              {/* Title */}
              <p
                id={`situation-${s.number}-title`}
                className="mt-2 text-[13px] font-medium leading-snug text-ink"
              >
                {s.title}
              </p>

              {/* Description */}
              <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
                {s.description}
              </p>

              {/* P&L number */}
              <p
                className="mt-3 font-mono font-medium"
                style={{
                  fontSize: '20px',
                  letterSpacing: '-0.5px',
                  color: AMOUNT_COLOURS[s.amountColour],
                }}
              >
                {s.amount}
              </p>
              {s.amountNote && (
                <p className="mt-0.5 text-[10px] text-ink-faint">
                  {s.amountNote}
                </p>
              )}

              {/* Action hint */}
              <p
                className="mt-3 text-[11px] text-accent"
                style={{
                  borderLeft: '2px solid #72C4B0',
                  paddingLeft: '8px',
                }}
              >
                {s.action}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
