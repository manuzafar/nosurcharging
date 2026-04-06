// SR-11, SR-12: Sentry client-side config with PII scrubbing.
// beforeSend strips email, IP, session ID, and financial data
// before any event is sent to Sentry.

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event) {
    // Strip PII from request data
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      delete data.email;
      delete data.ip;
      delete data.sessionId;
    }

    // Strip PII from user context
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      delete event.user.username;
    }

    // Strip financial data from extras
    if (event.extra) {
      delete event.extra.volume;
      delete event.extra.surchargeRate;
      delete event.extra.msfRate;
    }

    return event;
  },
});
