'use client';

// Homepage TrustBar — replaces the legacy three-column trust strip
// (deleted April 2026). A compact single-line live countdown to
// 1 October 2026 00:00 AEST, the moment the RBA surcharge ban begins.
//
// Sits between the hero and the scrollytelling preview. Hydrates with
// zeros (matches the SSR shell), then ticks every second on the client.
// Wrapped in Suspense in page.tsx because it is a client component.

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
      className="flex items-center justify-center gap-3 border-y border-rule bg-paper-white"
      style={{ padding: '14px 32px' }}
      aria-label="Time until the surcharge ban"
    >
      {/* Eyebrow pill — same pattern as the hero badge */}
      <span
        className="inline-flex items-center gap-1.5 rounded-full border bg-accent-light"
        style={{
          borderColor: '#72C4B0',
          borderWidth: '0.5px',
          padding: '4px 12px',
        }}
      >
        <span
          aria-hidden
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#1A6B5A',
          }}
        />
        <span
          className="uppercase"
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '1px',
            color: '#1A6B5A',
          }}
        >
          Surcharge ban · 1 Oct 2026
        </span>
      </span>

      {/* Countdown — JetBrains Mono, 15px, ink primary; days slightly
          larger and emerald; separators in rule colour at 300 weight. */}
      <span
        className="font-mono"
        style={{ fontSize: '15px', fontWeight: 700, color: '#1A1409' }}
        aria-live="off"
      >
        <span style={{ fontSize: '18px', color: '#1A6B5A' }}>{days}</span>
        <span>d</span>
        <span style={{ color: '#DDD5C8', fontWeight: 300 }}> · </span>
        {pad(hours)}h
        <span style={{ color: '#DDD5C8', fontWeight: 300 }}> · </span>
        {pad(minutes)}m
        <span style={{ color: '#DDD5C8', fontWeight: 300 }}> · </span>
        {pad(seconds)}s
      </span>

      {/* Trailing label */}
      <span style={{ fontSize: '12px', color: '#9A8C78' }}>
        remaining to act
      </span>
    </section>
  );
}
