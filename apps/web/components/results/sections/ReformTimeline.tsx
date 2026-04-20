'use client';

import { AU_REFORM_DATES } from '@nosurcharging/calculations/constants/au';

interface ReformTimelineProps {
  category: 1 | 2 | 3 | 4;
  pspName: string;
  now?: Date;
}

interface TimelineNode {
  date: Date;
  label: string;
  description: string;
  color: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getUrgencyText(category: 1 | 2 | 3 | 4, pspName: string): string {
  switch (category) {
    case 1:
      return 'Your IC rates drop automatically. No action required, but confirm with ' + pspName + '.';
    case 2:
      return 'Contact ' + pspName + ' before this date to negotiate your rate reduction.';
    case 3:
      return 'Your surcharge revenue on designated networks stops. Contact ' + pspName + ' immediately.';
    case 4:
      return 'Your surcharge revenue stops and your flat rate won\'t drop automatically. Contact ' + pspName + ' now.';
  }
}

export function ReformTimeline({ category, pspName, now }: ReformTimelineProps) {
  const today = now ?? new Date();
  const oct1 = new Date(AU_REFORM_DATES.surchargeBan);
  const oct30 = new Date(AU_REFORM_DATES.msfPublication);
  const jan30 = new Date(AU_REFORM_DATES.passThroughReport);
  const apr1 = new Date(AU_REFORM_DATES.foreignCardCap);

  const daysUntilOct1 = Math.ceil((oct1.getTime() - today.getTime()) / 86_400_000);

  const nodes: TimelineNode[] = [
    {
      date: today,
      label: 'Now',
      description: 'You are here',
      color: '#4B9E7E', // emerald
    },
    {
      date: oct1,
      label: '1 Oct 2026',
      description: 'Surcharge ban + IC cuts take effect',
      color: 'var(--color-text-danger, #C53030)', // red
    },
    {
      date: oct30,
      label: '30 Oct 2026',
      description: 'RBA publishes MSF benchmark data',
      color: 'var(--color-accent)', // amber
    },
    {
      date: jan30,
      label: '30 Jan 2027',
      description: 'First IC pass-through compliance report',
      color: 'var(--color-text-tertiary)', // gray
    },
    {
      date: apr1,
      label: '1 Apr 2027',
      description: 'Foreign card IC cap takes effect',
      color: 'var(--color-accent)', // amber
    },
  ];

  return (
    <div className="mt-4">
      {/* Days countdown */}
      {daysUntilOct1 > 0 && (
        <div
          className="rounded-lg p-4 mb-5"
          style={{
            background: 'var(--color-bg-secondary, #F5F3EF)',
            border: '1px solid var(--color-border-secondary)',
            textAlign: 'center',
          }}
        >
          <span className="font-mono" style={{ fontSize: '28px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {daysUntilOct1}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
            days until the surcharge ban
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative" style={{ paddingLeft: '24px' }}>
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: '7px',
            top: '8px',
            bottom: '8px',
            width: '1.5px',
            background: 'var(--color-border-secondary)',
          }}
        />

        {nodes.map((node, i) => (
          <div
            key={node.label}
            className="relative"
            style={{
              paddingBottom: i < nodes.length - 1 ? '28px' : '0',
            }}
          >
            {/* Dot */}
            <div
              style={{
                position: 'absolute',
                left: '-20px',
                top: '5px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: node.color,
                border: '2px solid var(--color-bg-primary, #FFFFFF)',
                boxShadow: '0 0 0 1.5px ' + node.color,
              }}
            />

            <div>
              <p className="font-mono" style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {node.label === 'Now' ? `Now (${formatDate(today)})` : node.label}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {node.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* October 1 callout */}
      <div
        className="mt-5 rounded-lg p-4"
        style={{
          background: '#FEF2F2',
          borderLeft: '3px solid var(--color-text-danger, #C53030)',
        }}
      >
        <p style={{ fontSize: '13px', color: 'var(--color-text-danger, #C53030)', fontWeight: 500, marginBottom: '4px' }}>
          1 October 2026
        </p>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {getUrgencyText(category, pspName)}
        </p>
      </div>
    </div>
  );
}
