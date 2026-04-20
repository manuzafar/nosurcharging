// Homepage trust bar — sits between hero and situations preview.
// Three columns: customer quote, RBA citation, free-tool note.
// ux-spec §1.4. White surface, rule borders top + bottom, vertical
// rule separators between columns at 40% opacity.

export function TrustBar() {
  return (
    <section
      className="border-y border-rule bg-paper-white px-5 py-4"
      aria-label="Trust statements"
    >
      <div className="mx-auto flex max-w-results flex-col items-stretch gap-4 min-[500px]:flex-row min-[500px]:items-center min-[500px]:gap-0">
        {/* Column 1 — quote */}
        <div className="flex-1 min-[500px]:px-5">
          <p className="text-[13px] italic leading-relaxed text-ink-secondary">
            &ldquo;I ran the assessment on my lunch break and sent the report
            to my accountant that afternoon.&rdquo;
          </p>
          <p className="mt-1 text-[11px] text-ink-faint">
            — Café owner, Newtown NSW
          </p>
        </div>

        {/* Separator */}
        <span
          aria-hidden
          className="hidden w-px self-center min-[500px]:block"
          style={{ height: '36px', background: 'rgba(221, 213, 200, 0.6)' }}
        />

        {/* Column 2 — RBA citation */}
        <div className="flex-1 min-[500px]:px-5">
          <p className="text-[12px] font-medium text-ink">
            RBA Conclusions Paper
          </p>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            March 2026 · Verified data
          </p>
        </div>

        {/* Separator */}
        <span
          aria-hidden
          className="hidden w-px self-center min-[500px]:block"
          style={{ height: '36px', background: 'rgba(221, 213, 200, 0.6)' }}
        />

        {/* Column 3 — free tool note */}
        <div className="flex-1 min-[500px]:px-5">
          <p className="text-[12px] font-medium text-ink">Free tool</p>
          <p className="mt-0.5 text-[11px] text-ink-faint">
            No account · No sales funnel
          </p>
        </div>
      </div>
    </section>
  );
}
