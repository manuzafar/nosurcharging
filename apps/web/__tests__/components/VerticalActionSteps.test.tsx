import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { VerticalActionSteps } from '@/components/results/VerticalActionSteps';
import { buildActions } from '@nosurcharging/calculations/actions';
import type { ActionContext } from '@nosurcharging/calculations/types';

const CTX: ActionContext = {
  volume: 500_000,
  surchargeRate: 0.015,
  surchargeRevenue: 7_500,
  icSaving: 4_200,
  plSwing: -3_300, // 0.66% break-even at this volume
};

describe('VerticalActionSteps', () => {
  // The "What to do, in order" eyebrow + count pill moved out to the
  // page-level SectionHeader in the editorial M1 overhaul. The
  // `actionCountText()` helper exported alongside the component is
  // unit-tested below.
  it('actionCountText() summarises urgent/plan/monitor counts', async () => {
    const { actionCountText } = await import(
      '@/components/results/VerticalActionSteps'
    );
    const cat4 = buildActions(4, 'Stripe', 'cafe', CTX);
    expect(actionCountText(cat4)).toBe('2 urgent · 1 plan · 1 monitor');
    const cat1 = buildActions(1, 'Stripe', 'cafe', CTX);
    expect(actionCountText(cat1)).toMatch(/plan|monitor/);
  });

  it('Cat 4 RAO action renders structured framework, not script text', () => {
    render(<VerticalActionSteps actions={buildActions(4, 'Stripe', 'cafe', CTX)} />);
    // Framework lever names appear
    expect(screen.getByText(/RECOVER through pricing/i)).toBeInTheDocument();
    expect(screen.getByText(/ABSORB from margin/i)).toBeInTheDocument();
    expect(screen.getByText(/OPTIMISE the cost itself/i)).toBeInTheDocument();
    // Framework title
    expect(
      screen.getByText(/Recover · Absorb · Optimise — choose your mix/),
    ).toBeInTheDocument();
  });

  it('RECOVER lever shows the break-even pill with percentage', () => {
    render(<VerticalActionSteps actions={buildActions(4, 'Stripe', 'cafe', CTX)} />);
    // Editorial M2 inline-grid drops the "Break-even:" prefix to keep
    // the tile compact — the value alone carries the meaning.
    expect(screen.getByText(/0\.66% increase recovers \$3,300/)).toBeInTheDocument();
  });

  it('always renders the OCT 2026 deadline marker as the last step', () => {
    render(<VerticalActionSteps actions={buildActions(2, 'Stripe', 'retail', CTX)} />);
    expect(screen.getByText(/Reform takes effect — surcharge ban applies/i)).toBeInTheDocument();
    expect(screen.getByText('1 OCTOBER 2026')).toBeInTheDocument();
    expect(screen.getByText('DEADLINE')).toBeInTheDocument();
  });

  it('numbers steps starting from 1', () => {
    const { container } = render(
      <VerticalActionSteps actions={buildActions(2, 'Stripe', 'retail', CTX)} />,
    );
    // The first step dot contains "1"
    const dots = container.querySelectorAll('div[style*="border-radius: 50%"]');
    expect(dots.length).toBeGreaterThan(0);
    // Find the step number "1" — should appear in the first numbered dot
    expect(screen.getByText('1', { selector: 'div' })).toBeInTheDocument();
  });

  it('does not render "your PSP" anywhere', () => {
    const cats: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];
    for (const c of cats) {
      const { unmount } = render(
        <VerticalActionSteps actions={buildActions(c, 'Stripe', 'retail', CTX, c === 5 ? 'zero_cost' : undefined)} />,
      );
      expect(document.body.textContent ?? '').not.toMatch(/your PSP/i);
      unmount();
    }
  });
});
