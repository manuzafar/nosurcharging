import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultsSidebar } from '@/components/results/shell/ResultsSidebar';

describe('ResultsSidebar', () => {
  const defaultProps = {
    activeSection: 'overview' as const,
    onNavClick: vi.fn(),
    urgentCount: 2,
    category: 2 as const,
  };

  it('renders all 9 section labels', () => {
    render(<ResultsSidebar {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Talk to customers')).toBeInTheDocument();
    expect(screen.getByText('Negotiation brief')).toBeInTheDocument();
    expect(screen.getByText('Readiness checklist')).toBeInTheDocument();
    expect(screen.getByText('PSP Rate Registry')).toBeInTheDocument();
    expect(screen.getByText('Values & rates')).toBeInTheDocument();
    expect(screen.getByText('Refine estimate')).toBeInTheDocument();
    expect(screen.getByText('Get help')).toBeInTheDocument();
  });

  it('renders group labels including Community', () => {
    render(<ResultsSidebar {...defaultProps} />);
    expect(screen.getByText('Result')).toBeInTheDocument();
    expect(screen.getByText('Prepare')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Understand')).toBeInTheDocument();
    expect(screen.getByText('Next step')).toBeInTheDocument();
  });

  it('highlights active section with border-left', () => {
    render(<ResultsSidebar {...defaultProps} activeSection="actions" />);
    const actionsBtn = screen.getByText('Actions').closest('button');
    expect(actionsBtn?.style.borderLeft).toContain('2px solid');
  });

  it('active section has accent-light background', () => {
    render(<ResultsSidebar {...defaultProps} activeSection="actions" />);
    const actionsBtn = screen.getByText('Actions').closest('button');
    expect(actionsBtn?.style.background).toBe('var(--color-accent-light)');
  });

  it('fires onNavClick when clicked', () => {
    const onClick = vi.fn();
    render(<ResultsSidebar {...defaultProps} onNavClick={onClick} />);
    fireEvent.click(screen.getByText('Values & rates'));
    expect(onClick).toHaveBeenCalledWith('values');
  });

  it('shows urgent count badge on actions', () => {
    render(<ResultsSidebar {...defaultProps} urgentCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows price badge on help', () => {
    render(<ResultsSidebar {...defaultProps} category={4} />);
    expect(screen.getByText('$3,500')).toBeInTheDocument();
  });

  it('no dot elements rendered', () => {
    const { container } = render(<ResultsSidebar {...defaultProps} />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(0);
  });

  it('renders dividers between groups', () => {
    const { container } = render(<ResultsSidebar {...defaultProps} />);
    const dividers = container.querySelectorAll('[data-testid="sidebar-divider"]');
    // 5 groups → 4 dividers (before "Prepare", "Community", "Understand", "Next step")
    expect(dividers.length).toBe(4);
  });
});
