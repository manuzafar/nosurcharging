import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SkeletonLoader } from '@/components/results/SkeletonLoader';

describe('SkeletonLoader', () => {
  it('exposes role=status with aria-live for assistive tech', () => {
    render(<SkeletonLoader />);
    const region = screen.getByRole('status');
    expect(region).toBeInTheDocument();
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('aria-label')).toMatch(/loading/i);
  });

  it('does NOT show legacy "Loading results..." text', () => {
    render(<SkeletonLoader />);
    expect(screen.queryByText(/Loading results/i)).not.toBeInTheDocument();
  });

  it('renders skeleton blocks', () => {
    render(<SkeletonLoader />);
    const blocks = screen.getAllByTestId('skeleton-block');
    // Two-column layout has top bar blocks + sidebar blocks + content blocks
    expect(blocks.length).toBeGreaterThan(10);
  });

  it('every block uses the skeleton pulse animation', () => {
    render(<SkeletonLoader />);
    const blocks = screen.getAllByTestId('skeleton-block');
    for (const block of blocks) {
      const style = block.getAttribute('style') ?? '';
      expect(style).toMatch(/skeletonPulse/);
      expect(style).toMatch(/1\.5s/);
    }
  });

  it('every block uses ink at 10% opacity background', () => {
    render(<SkeletonLoader />);
    const blocks = screen.getAllByTestId('skeleton-block');
    for (const block of blocks) {
      const style = block.getAttribute('style') ?? '';
      expect(style).toMatch(/rgba\(26,\s*20,\s*9,\s*0?\.1\)/);
    }
  });

  it('blocks are aria-hidden so screen readers only announce the region', () => {
    render(<SkeletonLoader />);
    const blocks = screen.getAllByTestId('skeleton-block');
    for (const block of blocks) {
      expect(block.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('includes a sidebar skeleton visible on md+', () => {
    const { container } = render(<SkeletonLoader />);
    const sidebar = container.querySelector('.hidden.md\\:block');
    expect(sidebar).toBeInTheDocument();
  });
});
