// Site footer — disclaimer, privacy link, copyright.

import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="py-6 px-5 text-center"
      style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}
    >
      <p
        style={{
          fontSize: '11px',
          lineHeight: '1.5',
          color: 'var(--color-text-secondary)',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        nosurcharging.com.au provides general guidance only. Not financial advice.
        Verify with your PSP before making business decisions.
      </p>

      <div className="mt-3 flex items-center justify-center gap-3">
        <Link
          href="/privacy"
          className="text-caption underline"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Privacy policy
        </Link>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>·</span>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
          © {new Date().getFullYear()} nosurcharging.com.au
        </span>
      </div>
    </footer>
  );
}
