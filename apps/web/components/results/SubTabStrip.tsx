'use client';

interface SubTabStripProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function SubTabStrip({ tabs, activeTab, onTabChange }: SubTabStripProps) {
  return (
    <div
      className="flex overflow-x-auto scrollbar-hide gap-1 border border-rule rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-bg-secondary, #F5F3EF)',
        padding: '3px',
      }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.key)}
            className="shrink-0 cursor-pointer"
            style={{
              fontSize: '12px',
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: isActive ? 'var(--color-accent)' : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--color-text-tertiary)',
              fontWeight: isActive ? 500 : 400,
              whiteSpace: 'nowrap',
              transition: 'background 150ms ease, color 150ms ease',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
