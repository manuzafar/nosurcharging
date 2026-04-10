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
    expect(allText.includes('your PSP')).toBe(false);
  });

  it('renders the section eyebrow "What to do, in order"', () => {
    render(<ActionList actions={cat4Actions} />);
    expect(screen.getByText(/What to do, in order/i)).toBeInTheDocument();
  });

  it('renders all three tier chips for Cat 4', () => {
    render(<ActionList actions={cat4Actions} />);
    expect(screen.getAllByText('URGENT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PLAN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MONITOR').length).toBeGreaterThan(0);
  });

  it('actions come from buildActions(), not hardcoded strings', () => {
    render(<ActionList actions={cat2Actions} />);
    expect(
      screen.getByText(/Ask Stripe whether your rate will change/),
    ).toBeInTheDocument();
  });

  it('urgent chip uses danger colour tokens', () => {
    render(<ActionList actions={cat2Actions} />);
    const urgentChip = screen.getAllByText('URGENT')[0]!;
    const style = urgentChip.getAttribute('style') ?? '';
    expect(style).toContain('--color-background-danger');
    expect(style).toContain('--color-text-danger');
  });

  it('plan chip uses accent-light background and accent text', () => {
    render(<ActionList actions={cat2Actions} />);
    const planChip = screen.getAllByText('PLAN')[0]!;
    const style = planChip.getAttribute('style') ?? '';
    // jsdom converts #EBF6F3 → rgb(235, 246, 243), #1A6B5A → rgb(26, 107, 90)
    expect(style).toMatch(/#EBF6F3|rgb\(235, 246, 243\)/);
    expect(style).toMatch(/#1A6B5A|rgb\(26, 107, 90\)/);
  });

  it('monitor chip uses tertiary text token', () => {
    render(<ActionList actions={cat2Actions} />);
    const monitorChip = screen.getAllByText('MONITOR')[0]!;
    const style = monitorChip.getAttribute('style') ?? '';
    expect(style).toContain('--color-text-tertiary');
  });

  it('date chips render in accent mono', () => {
    render(<ActionList actions={cat2Actions} />);
    const dateChip = screen.getAllByText('BEFORE END OF APRIL')[0]!;
    const style = dateChip.getAttribute('style') ?? '';
    expect(style).toMatch(/#1A6B5A|rgb\(26, 107, 90\)/);
    expect(dateChip.className).toContain('font-mono');
  });

  it('PSP name inline in Cat 4 actions', () => {
    render(<ActionList actions={cat4Actions} />);
    expect(
      screen.getByText(/Ask Tyro whether your rate will change/),
    ).toBeInTheDocument();
    const allText = document.body.textContent ?? '';
    expect(allText.includes('your PSP')).toBe(false);
  });

  it('renders the script block for actions that have one (italic)', () => {
    render(<ActionList actions={cat4Actions} />);
    // Cat 4 ACTION 1 script begins with the PSP name and "is reducing wholesale interchange"
    const scriptText = screen.getByText(/is reducing wholesale interchange costs/i);
    const style = scriptText.getAttribute('style') ?? '';
    expect(style).toContain('italic');
  });

  it('renders the why explanation for actions that have one', () => {
    render(<ActionList actions={cat4Actions} />);
    // Cat 4 ACTION 1 why begins "Flat rate adjustments aren't automatic"
    expect(
      screen.getByText(/Flat rate adjustments aren&#x27;t automatic|Flat rate adjustments aren't automatic/),
    ).toBeInTheDocument();
  });

  it('actions render in tier order: urgent → plan → monitor', () => {
    render(<ActionList actions={cat4Actions} />);
    const urgent = screen.getAllByText('URGENT')[0]!;
    const plan = screen.getAllByText('PLAN')[0]!;
    const monitor = screen.getAllByText('MONITOR')[0]!;
    // eslint-disable-next-line no-bitwise
    expect(
      urgent.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // eslint-disable-next-line no-bitwise
    expect(
      plan.compareDocumentPosition(monitor) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
