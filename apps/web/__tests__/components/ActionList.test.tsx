import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActionList } from '@/components/results/ActionList';
import { buildActions } from '@nosurcharging/calculations/actions';

describe('ActionList', () => {
  const cat2Actions = buildActions(2, 'Stripe', 'retail');
  const cat4Actions = buildActions(4, 'Tyro', 'cafe');

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
    // The first action text from buildActions for Cat 2 mentions Stripe
    expect(screen.getByText(/Call Stripe and say/)).toBeInTheDocument();
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

  it('date chips render in amber mono', () => {
    render(<ActionList actions={cat2Actions} />);
    const thisWeekChip = screen.getByText('This week');
    const style = thisWeekChip.getAttribute('style') ?? '';
    // jsdom converts #BA7517 to rgb(186, 117, 23)
    expect(style).toMatch(/#BA7517|rgb\(186, 117, 23\)/);
    expect(thisWeekChip.className).toContain('font-mono');
  });

  it('PSP name inline in Cat 4 actions', () => {
    render(<ActionList actions={cat4Actions} />);
    expect(screen.getByText(/Call Tyro and say/)).toBeInTheDocument();
    // No "your PSP" anywhere
    const allText = document.body.textContent ?? '';
    expect(allText.includes('your PSP')).toBe(false);
  });
});
