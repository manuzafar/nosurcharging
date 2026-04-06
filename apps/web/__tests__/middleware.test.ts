import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock next/server before importing middleware
vi.mock('next/server', () => {
  class MockNextResponse {
    status: number;
    headers: Map<string, string>;
    constructor(body: null, init?: { status?: number; headers?: Record<string, string> }) {
      this.status = init?.status ?? 200;
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }
    static next() {
      const res = new MockNextResponse(null, { status: 200 });
      return res;
    }
  }

  class MockNextRequest {
    method: string;
    url: string;
    private _headers: Map<string, string>;
    nextUrl: { pathname: string };

    constructor(url: string, init?: { method?: string; headers?: Record<string, string> }) {
      this.method = init?.method ?? 'GET';
      this.url = url;
      this._headers = new Map(Object.entries(init?.headers ?? {}));
      this.nextUrl = { pathname: new URL(url).pathname };
    }

    get headers() {
      return {
        get: (key: string) => this._headers.get(key) ?? null,
      };
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('CORS middleware', () => {
  beforeEach(() => {
    vi.stubEnv(
      'ALLOWED_ORIGINS',
      'https://nosurcharging.com.au,https://www.nosurcharging.com.au,https://staging.nosurcharging.com.au',
    );
  });

  it('allows https://nosurcharging.com.au', () => {
    const req = new NextRequest('https://nosurcharging.com.au/api/health', {
      method: 'GET',
      headers: { origin: 'https://nosurcharging.com.au' },
    });
    const res = middleware(req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://nosurcharging.com.au');
  });

  it('allows https://staging.nosurcharging.com.au', () => {
    const req = new NextRequest('https://nosurcharging.com.au/api/health', {
      method: 'GET',
      headers: { origin: 'https://staging.nosurcharging.com.au' },
    });
    const res = middleware(req);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://staging.nosurcharging.com.au',
    );
  });

  it('rejects attacker subdomain https://nosurcharging.com.au.attacker.com', () => {
    const req = new NextRequest('https://nosurcharging.com.au/api/health', {
      method: 'OPTIONS',
      headers: { origin: 'https://nosurcharging.com.au.attacker.com' },
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });

  it('rejects https://evil.com', () => {
    const req = new NextRequest('https://nosurcharging.com.au/api/health', {
      method: 'OPTIONS',
      headers: { origin: 'https://evil.com' },
    });
    const res = middleware(req);
    expect(res.status).toBe(403);
  });

  it('passes through when no Origin header present', () => {
    const req = new NextRequest('https://nosurcharging.com.au/api/health', {
      method: 'GET',
      headers: {},
    });
    const res = middleware(req);
    // NextResponse.next() returns status 200 and no CORS headers
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeFalsy();
  });
});
