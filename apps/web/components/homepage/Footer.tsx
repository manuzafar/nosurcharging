// Site footer — single row. Four-sentence professional disclaimer left,
// Legal disclaimer · Terms & conditions · Privacy policy links right.
// Long-form text lives at /disclaimer, /terms, and /privacy.

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-paper px-5 py-6">
      <div className="mx-auto flex max-w-results flex-col items-start justify-between gap-3 min-[500px]:flex-row min-[500px]:items-center">
        <p
          className="text-ink-faint"
          style={{
            fontSize: '11px',
            lineHeight: 1.6,
            maxWidth: '440px',
          }}
        >
          The assessments and figures on this website are estimates based on
          publicly available data and are provided for general guidance only.
          They do not constitute financial, legal, or accounting advice, and
          should not be relied upon as a substitute for advice from a
          qualified professional. nosurcharging.com.au is independent and has
          no commercial relationship with any payment service provider.
          Verify any figures with your payment provider before making business
          decisions.
        </p>

        <div className="flex flex-wrap items-center shrink-0">
          <Link
            href="/disclaimer"
            className="text-ink-faint hover:underline"
            style={{ fontSize: '11px', textUnderlineOffset: '2px' }}
          >
            Legal disclaimer
          </Link>
          <span className="text-ink-faint mx-2" aria-hidden>
            ·
          </span>
          <Link
            href="/terms"
            className="text-ink-faint hover:underline"
            style={{ fontSize: '11px', textUnderlineOffset: '2px' }}
          >
            Terms &amp; conditions
          </Link>
          <span className="text-ink-faint mx-2" aria-hidden>
            ·
          </span>
          <Link
            href="/privacy"
            className="text-ink-faint hover:underline"
            style={{ fontSize: '11px', textUnderlineOffset: '2px' }}
          >
            Privacy policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
