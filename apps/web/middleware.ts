// SR-07: CORS exact origin matching.
// Applied to /api/* routes only — NOT page routes.
//
// Matching: allowed.includes(origin) — array includes, NOT substring.
// NEVER: origin.includes('nosurcharging.com.au') — vulnerable to
//   'https://nosurcharging.com.au.attacker.com'

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function getAllowedOrigins(): string[] {
  return process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowed = getAllowedOrigins();

  // No Origin header (same-origin requests, non-browser clients) — pass through
  if (!origin) {
    return NextResponse.next();
  }

  const isAllowed = allowed.includes(origin);

  // Preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    if (isAllowed) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          ...CORS_HEADERS,
        },
      });
    }
    return new NextResponse(null, { status: 403 });
  }

  // Non-preflight request
  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

// Only apply to API routes — not page routes
export const config = {
  matcher: '/api/:path*',
};
