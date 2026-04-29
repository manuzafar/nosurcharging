// Analytics — PostHog only.
//
// Privacy posture: autocapture: false, no session_recording — only the
// explicit Analytics.* methods send events. Cookie consent ships in a
// follow-up PR; this configuration is safe to ship without consent under
// PostHog's Australian Privacy Act guidance because we're only sending
// merchant-classification data, not PII.

import posthog from 'posthog-js';

// ── Init ──────────────────────────────────────────────────────────────────────
let phInitialised = false;

export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  if (phInitialised) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false, // App Router — captured manually in PostHogProvider
    autocapture: false,      // Privacy: explicit Analytics.* calls only
    persistence: 'localStorage+cookie',
    loaded: () => {
      phInitialised = true;
    },
  });
}

// ── Pageview (manual, App Router) ─────────────────────────────────────────────
export function capturePageview(url: string): void {
  if (typeof window === 'undefined' || !phInitialised) return;
  posthog.capture('$pageview', { $current_url: url });
}

// ── Identity ──────────────────────────────────────────────────────────────────
export function identifyUser(
  emailHash: string,
  traits: {
    category?: number;
    psp?: string;
    volume_tier?: string;
    pl_swing_bucket?: string;
    industry?: string;
  },
): void {
  if (typeof window === 'undefined' || !phInitialised) return;
  posthog.identify(emailHash, { country: 'AU', ...traits });
}

// ── Legacy event wrapper ─────────────────────────────────────────────────────
// Two callsites in assessment/page.tsx still use trackEvent for events that
// fire at first-interaction (Expert mode activated, Card mix entered) rather
// than at funnel boundaries. The wrapper normalises the name to snake_case
// before sending to PostHog. Prefer the typed Analytics.* API for new events.
export function trackEvent(
  name: string,
  props?: Record<string, string | number>,
): void {
  if (typeof window === 'undefined' || !phInitialised) return;
  const phName = name.toLowerCase().replace(/\s+/g, '_');
  posthog.capture(phName, { country: 'AU', ...props });
}

// ── Typed API — snake_case, PostHog only ──────────────────────────────────────
// All NEW events go through Analytics.*. Legacy events use trackEvent until
// Phase 4 migrates them. After Phase 6, Analytics.* is the only API.
export const Analytics = {
  // ── Acquisition ────────────────────────────────────────────────────────
  homepageViewed(props: {
    referrer: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    is_mobile: boolean;
  }): void {
    if (!phInitialised) return;
    posthog.capture('homepage_viewed', {
      country: 'AU',
      referrer: props.referrer || 'direct',
      utm_source: props.utm_source ?? '',
      utm_medium: props.utm_medium ?? '',
      utm_campaign: props.utm_campaign ?? '',
      is_mobile: props.is_mobile,
    });
  },

  homepageCtaClicked(location: 'hero' | 'nav' | 'bottom'): void {
    if (!phInitialised) return;
    posthog.capture('cta_clicked_homepage', { country: 'AU', cta_location: location });
  },

  // ── Assessment funnel ──────────────────────────────────────────────────
  assessmentStarted(): void {
    if (!phInitialised) return;
    posthog.capture('assessment_started', { country: 'AU' });
  },

  stepCompleted(step: 1 | 2 | 3 | 4, props: Record<string, unknown>): void {
    if (!phInitialised) return;
    posthog.capture('step_completed', { country: 'AU', step, ...props });
  },

  assessmentAbandoned(at_step: number, time_spent_seconds: number): void {
    if (!phInitialised) return;
    posthog.capture('assessment_abandoned', {
      country: 'AU',
      at_step,
      time_spent_seconds,
    });
  },

  deadEndReached(
    volume_tier: string,
    action_taken: 'booked_call' | 'went_back' | 'left_page',
  ): void {
    if (!phInitialised) return;
    posthog.capture('dead_end_reached', { country: 'AU', volume_tier, action_taken });
  },

  // ── Plan-variant events (iteration 2 v5) ───────────────────────────────
  zeroCostRateSelected(props: { mode: string }): void {
    if (!phInitialised) return;
    posthog.capture('zero_cost_rate_selected', { country: 'AU', ...props });
  },

  blendedRatesEntered(props: Record<string, unknown>): void {
    if (!phInitialised) return;
    posthog.capture('blended_rates_entered', { country: 'AU', ...props });
  },

  strategicRateExitViewed(props: {
    trigger: 'self_select' | 'result_page';
  }): void {
    if (!phInitialised) return;
    posthog.capture('strategic_rate_exit_viewed', { country: 'AU', ...props });
  },

  // ── Results page ───────────────────────────────────────────────────────
  resultsViewed(props: {
    assessment_id: string;
    category: number;
    psp: string;
    plan_type: string;
    industry: string;
    volume_tier: string;
    pl_swing: number;
    pl_swing_bucket: string;
    surcharging: boolean;
    accuracy_pct: number;
    is_mobile: boolean;
  }): void {
    if (!phInitialised) return;
    posthog.capture('results_viewed', { country: 'AU', ...props });
  },

  sectionVisited(props: {
    section: string;
    category: number;
    time_since_results_viewed_seconds: number;
  }): void {
    if (!phInitialised) return;
    posthog.capture('section_visited', { country: 'AU', ...props });
  },

  subtabViewed(props: { section: string; tab: string; category: number }): void {
    if (!phInitialised) return;
    posthog.capture('subtab_viewed', { country: 'AU', ...props });
  },

  // ── Email gate (post-Step-4, pre-reveal) ──────────────────────────────
  // The old `emailCaptured` shape (capture_moment / pl_swing / etc.) was
  // tied to the deleted EmailCapture results-page form. The email gate
  // surfaces a single, pre-reveal capture point so the events here use a
  // smaller schema centred on the gate's two outcomes.
  emailGateShown(props: { assessment_id?: string; category: number }): void {
    if (!phInitialised) return;
    posthog.capture('email_gate_shown', { country: 'AU', ...props });
  },

  emailCaptured(props: { assessment_id?: string; marketing_consent: boolean }): void {
    if (!phInitialised) return;
    posthog.capture('email_captured', { country: 'AU', ...props });
  },

  emailGateSkipped(props: { assessment_id?: string }): void {
    if (!phInitialised) return;
    posthog.capture('email_gate_skipped', { country: 'AU', ...props });
  },

  // pl_swing, volume_tier, psp are best-effort: MobileBottomBar doesn't
  // have access to them, so they're optional in this schema.
  ctaClicked(props: {
    cta_type: string;
    cta_location: string;
    category: number;
    pl_swing?: number;
    volume_tier?: string;
    psp?: string;
  }): void {
    if (!phInitialised) return;
    posthog.capture('cta_clicked', { country: 'AU', ...props });
  },

  resultLooksOff(props: { category: number; accuracy_pct: number }): void {
    if (!phInitialised) return;
    posthog.capture('result_looks_off_clicked', { country: 'AU', ...props });
  },

  sliderUsed(props: { category: number; pass_through_pct: number }): void {
    if (!phInitialised) return;
    posthog.capture('slider_used', { country: 'AU', ...props });
  },

  assumptionsOpened(props: { category: number }): void {
    if (!phInitialised) return;
    posthog.capture('assumptions_opened', { country: 'AU', ...props });
  },

  accuracyRefined(props: {
    accuracy_before: number;
    accuracy_after: number;
    fields_filled: string;
    pl_swing_change: number;
  }): void {
    if (!phInitialised) return;
    posthog.capture('calculation_accuracy_refined', { country: 'AU', ...props });
  },

  // ── PSP Rate Registry ──────────────────────────────────────────────────
  registryFormStarted(props: { category: number; psp: string }): void {
    if (!phInitialised) return;
    posthog.capture('registry_form_started', { country: 'AU', ...props });
  },

  registryContributed(props: {
    psp: string;
    plan_type: string;
    volume_tier: string;
    industry: string;
  }): void {
    if (!phInitialised) return;
    posthog.capture('registry_contributed', { country: 'AU', ...props });
  },

  // ── Feedback modal ─────────────────────────────────────────────────────
  feedbackOpened(props: { category: number }): void {
    if (!phInitialised) return;
    posthog.capture('feedback_opened', { country: 'AU', ...props });
  },

  feedbackSubmitted(props: { category: number; rating?: number }): void {
    if (!phInitialised) return;
    posthog.capture('feedback_submitted', { country: 'AU', ...props });
  },
} as const;

// ── Volume tier helper (shared across events) ─────────────────────────────────
export function getVolumeTier(volume: number): string {
  if (volume < 100_000) return '<100k';
  if (volume < 500_000) return '100k-500k';
  if (volume < 1_000_000) return '500k-1m';
  if (volume < 3_000_000) return '1m-3m';
  if (volume < 10_000_000) return '3m-10m';
  return '10m+';
}

// ── P&L swing bucket helper ───────────────────────────────────────────────────
export function getPlSwingBucket(plSwing: number): string {
  if (plSwing > 5_000) return '>5k_gain';
  if (plSwing >= 0) return '0-5k_gain';
  if (plSwing >= -5_000) return '0-to-5k_loss';
  if (plSwing >= -10_000) return '5k-10k_loss';
  if (plSwing >= -25_000) return '10k-25k_loss';
  if (plSwing >= -50_000) return '25k-50k_loss';
  return '>50k_loss';
}
