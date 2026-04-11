// Site footer — ux-spec §1.8.
// Layout: flex space-between with the disclaimer block on the left and
// the privacy policy link on the right. Paper background, no top border.

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-paper px-5 py-6">
      <div className="mx-auto flex max-w-results flex-col items-start justify-between gap-3 min-[500px]:flex-row min-[500px]:items-center">
        <p
          className="text-ink-faint"
          style={{
            fontSize: '11px',
            lineHeight: '1.6',
            maxWidth: '440px',
          }}
        >
          General guidance only. Not financial advice. Based on RBA
          Conclusions Paper, March 2026. Verify with your payment provider
          before making business decisions.
        </p>

        <Link
          href="/privacy"
          className="text-ink-faint underline shrink-0"
          style={{
            fontSize: '11px',
            textUnderlineOffset: '2px',
          }}
        >
          Privacy policy
        </Link>
      </div>
    </footer>
  );
}
