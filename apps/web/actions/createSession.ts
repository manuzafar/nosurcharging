'use server';

// SR-01: Session IDs are server-generated via randomUUID().
// Cookie is HttpOnly, Secure, SameSite=Strict.
// Called once when the merchant checks the disclaimer consent.

import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const SESSION_COOKIE = 'ns_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

export async function createSession(): Promise<string> {
  const sessionId = randomUUID();

  cookies().set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

export async function getSessionId(): Promise<string | null> {
  const cookie = cookies().get(SESSION_COOKIE);
  return cookie?.value ?? null;
}
