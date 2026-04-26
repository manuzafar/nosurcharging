'use client';

// Small client island used at the top of legal pages (privacy, terms,
// disclaimer). Navigates with router.back() so a merchant who opened
// the page from the footer of /results lands back on the same /results
// page rather than the homepage. Outside the legal pages, prefer a
// regular <Link href="/"> when the destination is fixed.

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-accent"
      style={{
        fontSize: '13px',
        display: 'block',
        marginBottom: '40px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      ← Back
    </button>
  );
}
