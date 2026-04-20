import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReformTimeline } from '@/components/results/sections/ReformTimeline';

describe('ReformTimeline', () => {
  const mockNow = new Date('2026-04-20');

  it('renders all 5 timeline dates', () => {
    render(<ReformTimeline category={2} pspName="Stripe" now={mockNow} />);
    expect(screen.getByText(/Now/)).toBeInTheDocument();
    expect(screen.getByText('1 Oct 2026')).toBeInTheDocument();
    expect(screen.getByText('30 Oct 2026')).toBeInTheDocument();
    expect(screen.getByText('30 Jan 2027')).toBeInTheDocument();
    expect(screen.getByText('1 Apr 2027')).toBeInTheDocument();
  });

  it('shows days countdown', () => {
    render(<ReformTimeline category={2} pspName="Stripe" now={mockNow} />);
    // April 20 to Oct 1 = 164 days
    expect(screen.getByText('164')).toBeInTheDocument();
    expect(screen.getByText('days until the surcharge ban')).toBeInTheDocument();
  });

  it('hides countdown when past Oct 1', () => {
    const pastDate = new Date('2026-11-01');
    render(<ReformTimeline category={2} pspName="Stripe" now={pastDate} />);
    expect(screen.queryByText('days until the surcharge ban')).not.toBeInTheDocument();
  });

  it('renders October 1 callout', () => {
    render(<ReformTimeline category={4} pspName="Square" now={mockNow} />);
    expect(screen.getByText('1 October 2026')).toBeInTheDocument();
  });

  it('callout text varies by category — Cat 1', () => {
    render(<ReformTimeline category={1} pspName="Stripe" now={mockNow} />);
    expect(screen.getByText(/IC rates drop automatically/)).toBeInTheDocument();
  });

  it('callout text varies by category — Cat 3', () => {
    render(<ReformTimeline category={3} pspName="Tyro" now={mockNow} />);
    expect(screen.getByText(/surcharge revenue on designated networks stops/)).toBeInTheDocument();
  });

  it('callout includes PSP name', () => {
    render(<ReformTimeline category={2} pspName="Square" now={mockNow} />);
    expect(screen.getByText(/Square/)).toBeInTheDocument();
  });

  it('uses font-mono for date labels and countdown', () => {
    const { container } = render(<ReformTimeline category={2} pspName="Stripe" now={mockNow} />);
    const monoElements = container.querySelectorAll('.font-mono');
    expect(monoElements.length).toBeGreaterThanOrEqual(5);
  });
});
