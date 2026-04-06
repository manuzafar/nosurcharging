// SR-11, SR-12: Sentry server-side config with PII scrubbing.
// Same beforeSend as client — strips email, IP, session ID, financial data.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event) {
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      delete data.email;
      delete data.ip;
      delete data.sessionId;
    }

    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }

    if (event.extra) {
      delete event.extra.volume;
      delete event.extra.surchargeRate;
      delete event.extra.msfRate;
    }

    return event;
  },
});
