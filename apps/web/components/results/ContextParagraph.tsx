'use client';

// ContextParagraph — Section 3 of the new linear results page.
//
// 2–3 sentence body that sits between the hero P&L number (VerdictSection)
// and the metric cards. Plain English, current copy preserved verbatim
// from the previous VerdictSection body. PSP name is interpolated inline.
//
// Per the brief: no wrapper card, no eyebrow, no decorations. Just the
// paragraph against the page background. Mobile font scales with line
// length so the read stays comfortable on a 375px viewport.

interface ContextParagraphProps {
  category: 1 | 2 | 3 | 4 | 5;
  pspName: string;
}

function getBody(category: 1 | 2 | 3 | 4 | 5, psp: string): string {
  switch (category) {
    case 1:
      return `Your cost-plus plan means interchange savings flow to you automatically on 1 October. No action is needed to capture the saving — it will appear on your next ${psp} statement after the reform date. You should still verify this with ${psp} in writing before October.`;
    case 2:
      return `The interchange saving exists, but whether you see it depends on ${psp}. On a flat rate, ${psp} could absorb the full saving and keep your rate unchanged. You need to ask them directly — and get it in writing — whether they will pass through the saving.`;
    case 3:
      return `Your surcharge revenue on Visa, Mastercard, and eftpos disappears on 1 October. The interchange saving on your cost-plus plan offsets only a fraction of that lost revenue. How you respond — through pricing, absorbing the cost from margin, or optimising your payment setup — depends on your gross margin and competitive position.`;
    case 4:
      return `You face two challenges simultaneously: your surcharge revenue disappears, and your flat rate may not pass the interchange saving through to you. Before deciding how to respond, confirm with ${psp} what your actual rate will look like after October — the answer changes your real exposure.`;
    case 5:
      // Softened May 2026: zero-cost providers vary in how they handle
      // the transition (some move to flat, some to cost-plus, some
      // require a re-quote). Conditional language + an explicit
      // confirmation step keeps the report honest.
      return `You currently pay $0 for card acceptance — your customers cover it through the surcharge ${psp} adds at the terminal. From 1 October, that surcharge cannot apply to Visa, Mastercard, or eftpos. Most zero-cost providers will need to move you to a standard flat-rate plan — confirm with ${psp} which plan you'll be transferred to. You'll pay for card acceptance from your own margin for the first time.`;
  }
}

export function ContextParagraph({ category, pspName }: ContextParagraphProps) {
  return (
    <section className="px-5 md:px-8">
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.7,
          color: 'var(--color-text-secondary)',
          maxWidth: '620px',
        }}
      >
        {getBody(category, pspName)}
      </p>
    </section>
  );
}
