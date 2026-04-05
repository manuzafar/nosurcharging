// SR-08: Sanitise dynamic content before rendering.
// Client-safe — no Node dependencies. Can be imported from 'use client' components.
// Used for PSP names and other user-influenced content rendered inline.

export function sanitiseForHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
