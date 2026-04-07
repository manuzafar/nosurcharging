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

  it('renders the expected number of pulse blocks (per spec §3.11)', () => {
    render(<SkeletonLoader />);
    // 4 small placeholders (pill, hero, unit, anchor)
    // + 2 problem blocks
    // + 3 action card blocks
    // = 9 simple blocks (metric row uses its own testid)
    const blocks = screen.getAllByTestId('skeleton-block');
    expect(blocks.length).toBe(9);
  });

  it('renders the metric row placeholder with internal dividers', () => {
    render(<SkeletonLoader />);
    const metricRow = screen.getByTestId('skeleton-metric-row');
    expect(metricRow).toBeInTheDocument();
    // 3 internal dividers per spec
    expect(metricRow.children.length).toBe(3);
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
      // rgba(26, 20, 9, 0.1) = ink at 10%
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
});
