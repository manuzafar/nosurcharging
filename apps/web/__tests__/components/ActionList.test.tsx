import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionList } from '@/components/results/ActionList';
import { buildActions } from '@nosurcharging/calculations/actions';
import type { ActionContext } from '@nosurcharging/calculations/types';

const CTX: ActionContext = {
  volume: 500_000,
  surchargeRate: 0.015,
  surchargeRevenue: 7_500,
  icSaving: 4_200,
};

describe('ActionList', () => {
  const cat2Actions = buildActions(2, 'Stripe', 'retail', CTX);
  const cat4Actions = buildActions(4, 'Tyro', 'cafe', CTX);

  it('no instance of "your PSP" in rendered output', () => {
    render(<ActionList actions={cat2Actions} />);
    const allText = document.body.textContent ?? '';
    // "your PSP" should never appear — PSP name is always inline
    expect(allText.includes('your PSP')).toBe(false);
  });

  it('three urgency tier headers render for Cat 4', () => {
    render(<ActionList actions={cat4Actions} />);
    expect(screen.getByText('URGENT — DO THIS WEEK')).toBeInTheDocument();
    expect(screen.getByText('PLAN — BEFORE AUGUST')).toBeInTheDocument();
    expect(screen.getByText('MONITOR — AFTER OCTOBER')).toBeInTheDocument();
  });

  it('actions come from buildActions(), not hardcoded strings', () => {
    render(<ActionList actions={cat2Actions} />);
    // The first Cat 2 action's "what" instruction mentions Stripe by name
    expect(screen.getByText(/Ask Stripe whether your rate will change/)).toBeInTheDocument();
  });

  it('urgent pill has danger colour', () => {
    render(<ActionList actions={cat2Actions} />);
    const urgentPills = screen.getAllByText('urgent');
    expect(urgentPills.length).toBeGreaterThan(0);
    const style = urgentPills[0]!.getAttribute('style') ?? '';
    expect(style).toContain('--color-background-danger');
    expect(style).toContain('--color-text-danger');
  });

  it('plan pill has warning colour', () => {
    render(<ActionList actions={cat2Actions} />);
    const planPills = screen.getAllByText('plan');
    expect(planPills.length).toBeGreaterThan(0);
    const style = planPills[0]!.getAttribute('style') ?? '';
    expect(style).toContain('--color-background-warning');
    expect(style).toContain('--color-text-warning');
  });

  it('monitor pill has secondary colour', () => {
    render(<ActionList actions={cat2Actions} />);
    const monitorPills = screen.getAllByText('monitor');
    expect(monitorPills.length).toBeGreaterThan(0);
    const style = monitorPills[0]!.getAttribute('style') ?? '';
    expect(style).toContain('--color-background-secondary');
    expect(style).toContain('--color-text-secondary');
  });

  it('date chips render in accent mono', () => {
    render(<ActionList actions={cat2Actions} />);
    // Cat 2 first action timeAnchor is 'BEFORE END OF APRIL'
    const dateChip = screen.getAllByText('BEFORE END OF APRIL')[0]!;
    const style = dateChip.getAttribute('style') ?? '';
    // jsdom converts #1A6B5A to rgb(26, 107, 90)
    expect(style).toMatch(/#1A6B5A|rgb\(26, 107, 90\)/);
    expect(dateChip.className).toContain('font-mono');
  });

  it('PSP name inline in Cat 4 actions', () => {
    render(<ActionList actions={cat4Actions} />);
    // Cat 4 first action mentions Tyro by name
    expect(screen.getByText(/Ask Tyro whether your rate will change/)).toBeInTheDocument();
    // No "your PSP" anywhere
    const allText = document.body.textContent ?? '';
    expect(allText.includes('your PSP')).toBe(false);
  });
});
