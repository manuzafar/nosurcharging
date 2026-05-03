'use client';

// Blurred mirror of the real results page rendered behind the EmailGate.
// Same palette, same structure, same shapes — just with placeholder text
// ($—,—) where dollar figures would be and grey bars where prose would be.
// At 7px blur the merchant can read the layout but can't read any number.
//
// Pure presentational. No props. No analytics. No data.

export function EmailGateSkeleton() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden"
      style={{
        // Lower blur means more recognisable layout — at this strength a
        // user reads "report shape" but can't read any specific dollar.
        filter: 'blur(7px)',
        background: '#FAF7F2',  // paper-DEFAULT
      }}
    >
      {/* ── Top bar — mirrors ResultsTopBar (56px, ink bg, branded logo) ── */}
      <div
        style={{
          height: '56px',
          background: '#1A1409',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Branded logo "no surcharging" */}
          <span
            className="font-serif font-medium"
            style={{ color: '#FFFFFF', fontSize: '15px' }}
          >
            no
            <span className="italic" style={{ color: '#72C4B0' }}>
              surcharging
            </span>
          </span>
          {/* Situation pill */}
          <span
            className="uppercase font-medium"
            style={{
              background: 'rgba(229, 115, 115, 0.20)',
              color: '#E57373',
              fontSize: '10px',
              letterSpacing: '1.2px',
              padding: '3px 9px',
              borderRadius: '20px',
            }}
          >
            Situation 4
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* P&L mono */}
          <span
            className="font-mono"
            style={{ color: '#E57373', fontSize: '14px', fontWeight: 600 }}
          >
            −$—,—
          </span>
          {/* Accuracy pip */}
          <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: '11px' }}>
            Accuracy ▪ —%
          </span>
        </div>
      </div>

      {/* ── Body — mirrors the main results card area ── */}
      <div
        className="mx-auto"
        style={{ maxWidth: '720px', padding: '32px 20px' }}
      >
        {/* SubTabStrip (Summary · Where I stand · What's changing · Timeline) */}
        <div
          className="flex gap-6"
          style={{
            paddingBottom: '12px',
            borderBottom: '0.5px solid #DDD5C8',
          }}
        >
          {[100, 130, 110, 100].map((width, i) => (
            <div
              key={i}
              style={{
                height: '12px',
                width,
                background: i === 0 ? '#1A1409' : 'rgba(26, 20, 9, 0.30)',
                borderRadius: '3px',
              }}
            />
          ))}
        </div>

        {/* White VerdictSection card */}
        <div
          style={{
            marginTop: '16px',
            background: '#FFFFFE',
            border: '0.5px solid #DDD5C8',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          {/* Situation pill + estimated label row */}
          <div className="flex items-center gap-2">
            <span
              className="uppercase font-medium"
              style={{
                background: '#FDE5E5',
                color: '#C53030',
                fontSize: '10px',
                letterSpacing: '1.5px',
                padding: '4px 10px',
                borderRadius: '20px',
              }}
            >
              Situation 4
            </span>
            <span style={{ fontSize: '11px', color: '#9A8C78' }}>
              Estimated · market averages
            </span>
          </div>

          {/* Headline — serif. Bar to keep wording opaque but shape real. */}
          <div
            style={{
              marginTop: '14px',
              height: '20px',
              width: '78%',
              background: 'rgba(26, 20, 9, 0.40)',
              borderRadius: '4px',
            }}
          />

          {/* Hero range */}
          <p
            className="font-mono"
            style={{
              marginTop: '20px',
              fontSize: 'clamp(28px, 7vw, 44px)',
              color: '#C53030',
              fontWeight: 500,
              letterSpacing: '-0.5px',
            }}
          >
            $—,—
            <span
              className="font-sans mx-2"
              style={{ fontSize: '14px', color: '#9A8C78' }}
            >
              to
            </span>
            $—,—
          </p>

          <p
            style={{ marginTop: '6px', fontSize: '13px', color: '#6B5E4A' }}
          >
            per year from 1 October 2026
          </p>

          {/* Expected line */}
          <div className="flex items-center gap-2" style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '12px', color: '#6B5E4A' }}>Expected:</span>
            <span
              className="font-mono"
              style={{ fontSize: '13px', color: '#C53030', fontWeight: 500 }}
            >
              −$—,—
            </span>
            <span style={{ fontSize: '12px', color: '#9A8C78' }}>
              — at central scenario
            </span>
          </div>

          {/* Daily anchor */}
          <p style={{ marginTop: '20px', fontSize: '15px', color: '#3D3320', lineHeight: 1.6 }}>
            That&apos;s{' '}
            <span style={{ color: '#1A6B5A', fontWeight: 500 }}>$— more per day</span>{' '}
            in net payments cost.
          </p>

          {/* Context line */}
          <p style={{ marginTop: '10px', fontSize: '11px', color: '#9A8C78' }}>
            $—M annual card revenue · — flat rate —%
          </p>

          {/* Body paragraph (3 grey bars) */}
          <div
            style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '9px' }}
          >
            {[100, 96, 78].map((width, i) => (
              <div
                key={i}
                style={{
                  height: '10px',
                  width: `${width}%`,
                  background: 'rgba(26, 20, 9, 0.18)',
                  borderRadius: '3px',
                }}
              />
            ))}
          </div>
        </div>

        {/* MetricCards 2x2 grid */}
        <div className="grid grid-cols-2 gap-3" style={{ marginTop: '16px' }}>
          {[
            { label: 'INTERCHANGE SAVING', valueColor: '#166534' },
            { label: 'NET P&L IMPACT', valueColor: '#C53030' },
            { label: 'SURCHARGE REVENUE', valueColor: '#C53030' },
            { label: 'YOUR COST TODAY', valueColor: '#3D3320' },
          ].map((cell) => (
            <div
              key={cell.label}
              style={{
                background: '#FFFFFE',
                border: '0.5px solid #DDD5C8',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <p
                className="uppercase font-medium"
                style={{
                  fontSize: '10px',
                  letterSpacing: '1.2px',
                  color: '#9A8C78',
                }}
              >
                {cell.label}
              </p>
              <p
                className="font-mono"
                style={{
                  marginTop: '14px',
                  fontSize: 'clamp(14px, 4.5vw, 22px)',
                  color: cell.valueColor,
                  fontWeight: 500,
                }}
              >
                $—,—
              </p>
              <div
                style={{
                  marginTop: '8px',
                  height: '7px',
                  width: '55%',
                  background: 'rgba(26, 20, 9, 0.15)',
                  borderRadius: '3px',
                }}
              />
            </div>
          ))}
        </div>

        {/* Action list — mirrors ActionsSection card */}
        <div
          style={{
            marginTop: '20px',
            background: '#FFFFFE',
            border: '0.5px solid #DDD5C8',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <p
            className="uppercase font-medium"
            style={{
              fontSize: '10px',
              letterSpacing: '1.5px',
              color: '#9A8C78',
              marginBottom: '14px',
            }}
          >
            Your action plan
          </p>

          {[
            { stripe: '#A32D2D', label: 'URGENT' },
            { stripe: '#A32D2D', label: 'URGENT' },
            { stripe: '#854F0B', label: 'PLAN' },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                marginTop: i === 0 ? 0 : '10px',
                background: '#FAF7F2',
                borderLeft: `3px solid ${row.stripe}`,
                padding: '14px 16px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                <span
                  className="uppercase font-medium"
                  style={{
                    background: row.label === 'URGENT' ? '#FDE5E5' : '#FEF3C7',
                    color: row.label === 'URGENT' ? '#C53030' : '#854F0B',
                    fontSize: '10px',
                    letterSpacing: '0.8px',
                    padding: '2px 7px',
                    borderRadius: '20px',
                  }}
                >
                  {row.label}
                </span>
                <div
                  style={{
                    height: '8px',
                    width: '90px',
                    background: 'rgba(26, 20, 9, 0.25)',
                    borderRadius: '3px',
                  }}
                />
              </div>
              <div
                style={{
                  height: '11px',
                  width: '85%',
                  background: 'rgba(26, 20, 9, 0.30)',
                  borderRadius: '3px',
                }}
              />
              <div
                style={{
                  marginTop: '6px',
                  height: '11px',
                  width: '60%',
                  background: 'rgba(26, 20, 9, 0.20)',
                  borderRadius: '3px',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
