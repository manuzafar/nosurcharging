import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from 'next/font/google';
import { validateConfig } from '@/lib/validateConfig';
import './globals.css';

// Validate environment variables once on first render.
// Runs inside the component function, not at module scope,
// so env vars from .env.local are available.
let configValidated = false;

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500'],
  display: 'swap',
});

const serif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: '400',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'nosurcharging.com.au — Merchant Payments Intelligence',
  description:
    'Free, independent merchant payments intelligence. Understand what card acceptance costs you and what the RBA October 2026 surcharge reform means for your business.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!configValidated) {
    validateConfig();
    configValidated = true;
  }

  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <head>
        <script
          async
          src="https://plausible.io/js/pa-8DBVtuLndaE6PXL0VuXcj.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
