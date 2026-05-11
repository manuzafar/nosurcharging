// "See what merchants get" — three sample reports, paper background,
// 3-col grid (desktop) / 1-col stack (mobile). Per
// HOMEPAGE_REDESIGN_BRIEF.md Section 4. Demonstrates the product output
// across three category outcomes (winner, conditional, high-impact)
// without committing the visitor to start an assessment.
//
// Anchor `id="samples"` is the target of the hero's secondary CTA
// ("See sample report ↓") introduced in M1.

interface SampleCard {
  variant: 'winner' | 'conditional' | 'high-impact';
  pill: string;
  context: string;
  impactDisplay: string;
  impactPositive: boolean;
  verdict: string;
  actionEmphasis: string;
  actionTail: string;
}

const SAMPLES: ReadonlyArray<SampleCard> = [
  {
    variant: 'winner',
    pill: 'Situation 1',
    context: '$5M cost-plus · not surcharging',
    impactDisplay: '+$1,200',
    impactPositive: true,
    verdict: 'Your costs fall automatically on 1 October.',
    actionEmphasis: 'Confirm with Stripe in writing',
    actionTail: ' that the new IC caps will flow to your cost-plus rate.',
  },
  {
    variant: 'conditional',
    pill: 'Situation 2',
    context: '$3M flat rate · not surcharging',
    impactDisplay: '−$15,300',
    impactPositive: false,
    verdict: "The saving exists — but it won't arrive automatically.",
    actionEmphasis: 'Ask Stripe to commit to passing through the IC reduction',
    actionTail: '. Get it in writing before October.',
  },
  {
    variant: 'high-impact',
    pill: 'Situation 4',
    context: '$2M flat rate · surcharging at 2%',
    impactDisplay: '−$24,400',
    impactPositive: false,
    verdict: 'You face both challenges simultaneously.',
    actionEmphasis: 'Decide repricing strategy + ask Stripe for itemised pricing',
    actionTail: ' — both before August.',
  },
] as const;

const VARIANT_STYLES: Record<
  SampleCard['variant'],
  { pillBg: string; pillBorder: string; pillFg: string }
> = {
  winner: {
    pillBg: 'var(--color-background-success)',
    pillBorder: 'var(--color-border-success)',
    pillFg: 'var(--color-text-success)',
  },
  conditional: {
    pillBg: 'var(--color-background-warning)',
    pillBorder: 'var(--color-border-warning)',
    pillFg: 'var(--color-text-warning)',
  },
  'high-impact': {
    pillBg: '#FDF2F2',
    pillBorder: 'rgba(191,53,53,0.35)',
    pillFg: 'var(--color-text-danger)',
  },
};

export function SampleResultsSection() {
  return (
    <section
      id="samples"
      className="bg-paper"
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
          See what merchants get
        </p>
        <h2
          className="mt-3 text-center font-serif text-ink"
          style={{
            fontSize: 'clamp(28px, 4.5vw, 38px)',
            fontWeight: 500,
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
          }}
        >
          Real reports. Real numbers.
        </h2>
        <p
          className="mx-auto mt-3 text-center text-ink-secondary"
          style={{
            fontSize: 'clamp(13px, 1.5vw, 15px)',
            lineHeight: 1.6,
            maxWidth: '540px',
          }}
        >
          Every merchant gets a tailored report. Here are three examples
          — same calculation engine, different situations.
        </p>

        <div
          className="mt-10 grid grid-cols-1 sm:grid-cols-3"
          style={{ gap: '14px' }}
        >
          {SAMPLES.map((sample) => {
            const styles = VARIANT_STYLES[sample.variant];
            return (
              <article
                key={sample.pill + sample.context}
                className="flex flex-col rounded-xl"
                style={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  padding: '20px',
                  gap: '14px',
                }}
              >
                <span
                  className="inline-flex self-start font-mono uppercase"
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    letterSpacing: '1.2px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: styles.pillBg,
                    color: styles.pillFg,
                    border: `0.5px solid ${styles.pillBorder}`,
                  }}
                >
                  {sample.pill}
                </span>
                <p
                  className="font-mono"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.4px',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {sample.context}
                </p>
                <p
                  className="font-mono"
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    letterSpacing: '-0.5px',
                    color: sample.impactPositive
                      ? 'var(--color-text-success)'
                      : 'var(--color-text-danger)',
                  }}
                >
                  {sample.impactDisplay}
                </p>
                <p
                  className="font-serif text-ink"
                  style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.4 }}
                >
                  {sample.verdict}
                </p>
                <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }} />
                <p
                  className="text-ink-secondary"
                  style={{ fontSize: '11px', lineHeight: 1.55 }}
                >
                  Next:{' '}
                  <strong
                    className="font-medium"
                    style={{ color: 'var(--color-text-accent, #1A6B5A)' }}
                  >
                    {sample.actionEmphasis}
                  </strong>
                  {sample.actionTail}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
