import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileMiniNav } from '@/components/results/shell/MobileMiniNav';

describe('MobileMiniNav', () => {
  const defaultProps = {
    activeSection: 'overview' as const,
    onNavClick: vi.fn(),
    plSwing: 1700,
  };

  it('renders all 5 section tabs', () => {
    render(<MobileMiniNav {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Values & rates')).toBeInTheDocument();
    expect(screen.getByText('Refine estimate')).toBeInTheDocument();
    expect(screen.getByText('Get help')).toBeInTheDocument();
  });

  it('renders P&L anchor number', () => {
    render(<MobileMiniNav {...defaultProps} plSwing={-5000} />);
    expect(screen.getByText('−$5,000')).toBeInTheDocument();
  });

  it('highlights active tab with accent background', () => {
    render(<MobileMiniNav {...defaultProps} activeSection="actions" />);
    const actionsTab = screen.getByText('Actions');
    expect(actionsTab).toHaveStyle({ background: 'var(--color-accent)', color: '#FFFFFF' });
  });

  it('fires onNavClick when tab clicked', () => {
    const onClick = vi.fn();
    render(<MobileMiniNav {...defaultProps} onNavClick={onClick} />);
    fireEvent.click(screen.getByText('Get help'));
    expect(onClick).toHaveBeenCalledWith('help');
  });

  it('has md:hidden class', () => {
    const { container } = render(<MobileMiniNav {...defaultProps} />);
    expect(container.firstChild).toHaveClass('md:hidden');
  });
});
