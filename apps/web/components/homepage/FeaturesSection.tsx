// Homepage "How it works" — restructured per ux-spec §1.6.
// Was: three numbered features describing the product.
// Now: four numbered questions matching the actual assessment steps,
// each with a one-line hint explaining why the question matters.
// Bordered container, left number column, right question + hint rows.

interface Step {
  number: string;
  question: string;
  hint: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    question: 'How much do you process in card payments?',
    hint: 'We calculate your actual dollar impact — not a percentage, a number.',
  },
  {
    number: '02',
    question: 'Does your statement show one rate, or a breakdown?',
    hint: 'This determines whether the cost saving reaches you automatically or depends on a rate review.',
  },
  {
    number: '03',
    question: 'Do you add a surcharge to card payments?',
    hint: 'The ban is the biggest variable. If you surcharge, you need to act before October.',
  },
  {
    number: '04',
    question: 'What industry are you in?',
    hint: 'For average transaction size, which affects the calculation.',
  },
];

export function FeaturesSection() {
  return (
    <section className="border-b border-rule bg-paper px-5 py-12">
      {/* Eyebrow label */}
      <p className="text-center text-[10px] font-medium uppercase tracking-[3px] text-ink-faint">
        Four questions. Your report.
      </p>

      {/* Steps container */}
      <div className="mx-auto mt-7 max-w-[480px] border border-rule bg-paper-white">
        {STEPS.map((step, i) => (
          <div
            key={step.number}
            className="flex items-start"
            style={
              i < STEPS.length - 1
                ? { borderBottom: '1px solid rgba(221, 213, 200, 0.6)' }
                : undefined
            }
          >
            {/* Step number — fixed-width left column */}
            <div
              className="shrink-0"
              style={{
                width: '52px',
                padding: '18px 0',
                textAlign: 'center',
                borderRight: '1px solid rgba(221, 213, 200, 0.6)',
              }}
            >
              <span
                className="font-mono font-medium text-accent"
                style={{ fontSize: '11px', letterSpacing: '0.5px' }}
              >
                {step.number}
              </span>
            </div>

            {/* Question + hint */}
            <div className="flex-1 px-5 py-4">
              <p
                className="font-serif text-ink"
                style={{ fontSize: '15px', lineHeight: '1.35' }}
              >
                {step.question}
              </p>
              <p
                className="mt-1 text-ink-faint"
                style={{ fontSize: '12px', lineHeight: '1.55' }}
              >
                {step.hint}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
