// Three numbered features. Bordered row, not cards with icons.
// Each: accent mono number left, text right.
// Mobile: single column stack.

const FEATURES = [
  {
    number: '01',
    title: 'Answer four questions',
    description:
      'Your card volume, plan type, surcharging status, and industry. Under five minutes. No account required.',
  },
  {
    number: '02',
    title: 'See your P&L impact',
    description:
      'A personalised calculation of how the October 2026 interchange cuts and surcharge ban affect your bottom line — in dollars.',
  },
  {
    number: '03',
    title: 'Get your action plan',
    description:
      'Specific actions with your PSP name, exact dates, and urgency tiers. Not generic advice — personalised to your situation.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-12 px-5">
      <div className="mx-auto max-w-results">
        <h2
          className="text-center font-serif font-medium"
          style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}
        >
          How it works
        </h2>

        <div
          className="mt-6 rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--color-border-secondary)' }}
        >
          {FEATURES.map((feature, i) => (
            <div
              key={feature.number}
              className="flex gap-4 p-5 max-[500px]:flex-col"
              style={
                i < FEATURES.length - 1
                  ? { borderBottom: '1px solid var(--color-border-secondary)' }
                  : undefined
              }
            >
              {/* Number */}
              <span
                className="font-mono font-medium shrink-0"
                style={{ fontSize: '14px', color: '#1A6B5A' }}
              >
                {feature.number}
              </span>

              {/* Text */}
              <div>
                <p
                  className="font-medium"
                  style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}
                >
                  {feature.title}
                </p>
                <p
                  className="mt-1 text-body-sm"
                  style={{ color: 'var(--color-text-secondary)', lineHeight: '1.65' }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
