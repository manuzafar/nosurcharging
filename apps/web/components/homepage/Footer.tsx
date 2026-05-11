// Site footer — restructured per HOMEPAGE_REDESIGN_BRIEF.md Section 8.
// Dark `#1A1409` background, 4-column grid (Brand / Resources / Sources
// / Legal) on desktop, 2-column on tablet, 1-column on mobile. Bottom
// row carries the independence statement + copyright.

import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const RESOURCES: FooterLink[] = [
  { label: 'Run assessment', href: '/assessment' },
];

const SOURCES: FooterLink[] = [
  {
    label: 'RBA Review 2024-26',
    href: 'https://www.rba.gov.au/payments-and-infrastructure/review-of-retail-payments-regulation/2026-03/',
    external: true,
  },
  {
    label: 'Reserve Bank',
    href: 'https://www.rba.gov.au/',
    external: true,
  },
];

const LEGAL: FooterLink[] = [
  { label: 'Not financial advice', href: '/disclaimer' },
  { label: 'Terms & conditions', href: '/terms' },
  { label: 'Privacy policy', href: '/privacy' },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '1.4px',
          color: 'rgba(255,255,255,0.95)',
        }}
      >
        {title}
      </p>
      <ul className="mt-3 flex flex-col" style={{ gap: '8px' }}>
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity duration-150 hover:opacity-100"
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.55,
                }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="transition-opacity duration-150 hover:opacity-100"
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.55,
                }}
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        background: '#1A1409',
        padding: 'clamp(40px, 5vw, 56px) clamp(18px, 3vw, 28px) 28px',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: '1000px' }}>
        <div
          className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
          style={{ gap: 'clamp(28px, 3vw, 36px)' }}
        >
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <p
              className="font-serif font-medium"
              style={{
                fontSize: '17px',
                color: 'rgba(255,255,255,0.95)',
                letterSpacing: '-0.2px',
              }}
            >
              nosurcharging
              <span className="italic" style={{ color: '#5DCAA5' }}>
                .com.au
              </span>
            </p>
            <p
              className="mt-3"
              style={{
                fontSize: '13px',
                lineHeight: 1.55,
                color: 'rgba(255,255,255,0.55)',
                maxWidth: '280px',
              }}
            >
              Independent payments intelligence for Australian businesses
              preparing for the October 2026 reform.
            </p>
          </div>

          <FooterColumn title="Resources" links={RESOURCES} />
          <FooterColumn title="Sources" links={SOURCES} />
          <FooterColumn title="Legal" links={LEGAL} />
        </div>

        {/* Bottom row */}
        <div
          className="mt-10 flex flex-col-reverse items-start sm:flex-row sm:items-center sm:justify-between"
          style={{
            paddingTop: '24px',
            borderTop: '0.5px solid rgba(255,255,255,0.1)',
            gap: '12px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.55,
            }}
          >
            Independent analysis. Not affiliated with any PSP, acquirer,
            or financial institution.
          </p>
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.55,
            }}
          >
            &copy; 2026 nosurcharging.com.au
          </p>
        </div>
      </div>
    </footer>
  );
}
