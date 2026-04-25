import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBottomBar } from '@/components/results/shell/MobileBottomBar';

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  Analytics: { ctaClicked: vi.fn() },
}));

describe('MobileBottomBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders CTA with $2,500 for Cat 1', () => {
    render(<MobileBottomBar category={1} />);
    expect(screen.getByText(/Book a call · \$2,500/)).toBeInTheDocument();
  });

  it('renders CTA with $2,500 for Cat 2', () => {
    render(<MobileBottomBar category={2} />);
    expect(screen.getByText(/Book a call · \$2,500/)).toBeInTheDocument();
  });

  it('renders CTA with $3,500 for Cat 3', () => {
    render(<MobileBottomBar category={3} />);
    expect(screen.getByText(/Book a call · \$3,500/)).toBeInTheDocument();
  });

  it('renders CTA with $3,500 for Cat 4', () => {
    render(<MobileBottomBar category={4} />);
    expect(screen.getByText(/Book a call · \$3,500/)).toBeInTheDocument();
  });

  it('renders save result button', () => {
    render(<MobileBottomBar category={1} />);
    expect(screen.getByText('Save result')).toBeInTheDocument();
  });

  it('copies URL on save click', () => {
    render(<MobileBottomBar category={1} />);
    fireEvent.click(screen.getByText('Save result'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('has md:hidden class', () => {
    const { container } = render(<MobileBottomBar category={1} />);
    expect(container.firstChild).toHaveClass('md:hidden');
  });
});
