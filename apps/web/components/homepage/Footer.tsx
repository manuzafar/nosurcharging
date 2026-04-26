// Site footer — links only. The four-sentence in-line disclaimer was
// removed in favour of the dedicated /disclaimer, /terms, and /privacy
// pages, which carry the full legal disclosure.

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-paper px-5 py-6">
      <div className="mx-auto flex max-w-results justify-end">
        <div className="flex flex-wrap items-center">
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
