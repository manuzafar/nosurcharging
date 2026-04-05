// Plausible analytics helper
// Every event includes { country: 'AU' } for multi-market analytics

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number> },
    ) => void;
  }
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number>,
) {
  if (typeof window === 'undefined') return;
  if (!window.plausible) return;
  window.plausible(name, { props: { country: 'AU', ...props } });
}
