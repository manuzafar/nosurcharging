'use client';

// Homepage countdown band — per HOMEPAGE_REDESIGN_BRIEF.md Section 3.
// Dark `#1A1409` band immediately below the hero, with a pulse-red dot
// pill, mono 18px white-95% countdown numbers, and a "remaining to act"
// meta label. Hydrates with zeros (matches the SSR shell), then ticks
// every second on the client. Wrapped in Suspense in page.tsx because
// it is a client component.

import { useEffect, useState } from 'react';

// 1 Oct 2026 00:00:00 AEST (UTC+10). Oct 1 is a Thursday in 2026; AEDT
// begins first Sunday of October (Oct 4), so this instant is still AEST.
const TARGET = new Date('2026-10-01T00:00:00+10:00').getTime();

const pad = (n: number) => String(n).padStart(2, '0');

export function TrustBar() {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, TARGET - Date.now());
      const s = Math.floor(diff / 1000);
      setDays(Math.floor(s / 86400));
      setHours(Math.floor((s % 86400) / 3600));
      setMinutes(Math.floor((s % 3600) / 60));
      setSeconds(s % 60);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="flex flex-wrap items-center justify-center"
      style={{
        padding: '14px 28px',
        gap: '18px',
        background: '#1A1409',
      }}
      aria-label="Time until the surcharge ban"
    >
      {/* Pill — rgba white bg with pulsing red dot */}
      <span
        className="inline-flex items-center"
        style={{
          gap: '8px',
          padding: '4px 12px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <span
          aria-hidden
          className="pulse-soft"
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#E26A5C',
          }}
        />
        <span
          className="font-mono uppercase"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '1.2px',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          Surcharge ban
        </span>
      </span>

      {/* Number row — mono 18px white-95% */}
      <span
        className="font-mono"
        style={{
          fontSize: '18px',
          fontWeight: 500,
          letterSpacing: '0.4px',
          color: 'rgba(255,255,255,0.95)',
        }}
        aria-live="off"
      >
        {days}d
        <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
        {pad(hours)}h
        <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
        {pad(minutes)}m
        <span style={{ color: 'rgba(255,255,255,0.25)' }}> · </span>
        {pad(seconds)}s
      </span>

      {/* Meta */}
      <span
        className="font-mono"
        style={{
          fontSize: '11px',
          letterSpacing: '0.4px',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        remaining to act
      </span>
    </section>
  );
}
