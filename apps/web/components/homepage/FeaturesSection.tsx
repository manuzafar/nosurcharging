// Homepage "Four questions" section — refined per
// HOMEPAGE_REDESIGN_BRIEF.md Section 6. Adds the section headline +
// subhead, widens the question table to 720px, and refreshes the
// row treatment while preserving the four-question copy verbatim.

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
    <section
      className="border-b border-rule bg-paper"
      style={{ padding: 'clamp(48px, 7vw, 64px) clamp(18px, 3vw, 28px)' }}
    >
      <div className="mx-auto" style={{ maxWidth: '880px' }}>
        <p
          className="text-center font-mono uppercase"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '1.4px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Four questions · your report
        </p>
        <h2
          className="mt-3 text-center font-serif text-ink"
          style={{
            fontSize: 'clamp(24px, 4.5vw, 38px)',
            fontWeight: 500,
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
          }}
        >
          No statement in front of you?{' '}
          <em className="italic text-accent" style={{ fontStyle: 'italic' }}>
            No problem.
          </em>
        </h2>
        <p
          className="mx-auto mt-3 text-center text-ink-secondary"
          style={{
            fontSize: 'clamp(13px, 1.5vw, 15px)',
            lineHeight: 1.6,
            maxWidth: '540px',
          }}
        >
          Plain-English questions a layperson can answer. We do the math.
        </p>

        <div
          className="mx-auto mt-9 rounded-xl"
          style={{
            maxWidth: '720px',
            background: 'var(--color-background-primary)',
            border: '0.5px solid var(--color-border-tertiary)',
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="flex items-start"
              style={
                i < STEPS.length - 1
                  ? { borderBottom: '0.5px solid var(--color-border-tertiary)' }
                  : undefined
              }
            >
              <div
                className="shrink-0"
                style={{
                  width: '64px',
                  padding: '20px 0',
                  textAlign: 'center',
                  borderRight: '0.5px solid var(--color-border-tertiary)',
                }}
              >
                <span
                  className="font-mono font-medium"
                  style={{
                    fontSize: '12px',
                    letterSpacing: '1px',
                    color: '#1A6B5A',
                  }}
                >
                  {step.number}
                </span>
              </div>
              <div className="flex-1" style={{ padding: '18px 22px' }}>
                <p
                  className="font-serif text-ink"
                  style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.35 }}
                >
                  {step.question}
                </p>
                <p
                  className="mt-1 text-ink-secondary"
                  style={{ fontSize: '13px', lineHeight: 1.55 }}
                >
                  {step.hint}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
