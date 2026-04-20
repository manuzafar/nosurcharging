import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubTabStrip } from '@/components/results/SubTabStrip';

const TABS = [
  { key: 'a', label: 'Tab A' },
  { key: 'b', label: 'Tab B' },
  { key: 'c', label: 'Tab C' },
];

describe('SubTabStrip', () => {
  it('renders all tab labels', () => {
    render(<SubTabStrip tabs={TABS} activeTab="a" onTabChange={vi.fn()} />);
    expect(screen.getByText('Tab A')).toBeInTheDocument();
    expect(screen.getByText('Tab B')).toBeInTheDocument();
    expect(screen.getByText('Tab C')).toBeInTheDocument();
  });

  it('marks active tab with aria-selected=true', () => {
    render(<SubTabStrip tabs={TABS} activeTab="b" onTabChange={vi.fn()} />);
    expect(screen.getByText('Tab B').closest('button')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Tab A').closest('button')).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has accent background', () => {
    render(<SubTabStrip tabs={TABS} activeTab="a" onTabChange={vi.fn()} />);
    const active = screen.getByText('Tab A').closest('button');
    expect(active?.style.background).toContain('var(--color-accent)');
  });

  it('inactive tab has transparent background', () => {
    render(<SubTabStrip tabs={TABS} activeTab="a" onTabChange={vi.fn()} />);
    const inactive = screen.getByText('Tab B').closest('button');
    expect(inactive?.style.background).toBe('transparent');
  });

  it('fires onTabChange with correct key on click', () => {
    const onChange = vi.fn();
    render(<SubTabStrip tabs={TABS} activeTab="a" onTabChange={onChange} />);
    fireEvent.click(screen.getByText('Tab C'));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('has tablist role on container', () => {
    render(<SubTabStrip tabs={TABS} activeTab="a" onTabChange={vi.fn()} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('each button has tab role', () => {
    render(<SubTabStrip tabs={TABS} activeTab="a" onTabChange={vi.fn()} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });
});
