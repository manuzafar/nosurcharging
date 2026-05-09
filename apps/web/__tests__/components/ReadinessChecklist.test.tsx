import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadinessChecklist } from '@/components/results/sections/ReadinessChecklist';

// ReadinessChecklist is wrapped in CollapsibleSection (collapsed by default).
function renderOpen(props: { category: 1 | 2 | 3 | 4 | 5; pspName: string }) {
  const result = render(<ReadinessChecklist {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /readiness checklist/i }));
  return result;
}

describe('ReadinessChecklist', () => {
  it('renders section with correct id', () => {
    const { container } = render(<ReadinessChecklist category={4} pspName="Stripe" />);
    const section = container.querySelector('section');
    expect(section?.id).toBe('checklist');
    expect(section?.dataset.section).toBe('checklist');
  });

  it('Cat 3/4 renders 5 checklist items', () => {
    renderOpen({ category: 4, pspName: 'Stripe' });
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
  });

  it('Cat 1/2 renders 4 checklist items', () => {
    renderOpen({ category: 1, pspName: 'Stripe' });
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
  });

  it('all checkboxes start unchecked', () => {
    renderOpen({ category: 2, pspName: 'Square' });
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });
  });

  it('checking a box updates progress', () => {
    renderOpen({ category: 1, pspName: 'Stripe' });
    expect(screen.getByText('0/4')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]!);
    expect(screen.getByText('1/4')).toBeInTheDocument();
  });

  it('progress bar fill width updates', () => {
    const { container } = renderOpen({ category: 2, pspName: 'Stripe' });
    const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement;
    expect(fill.style.width).toBe('0%');
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]!);
    // 1/4 = 25%
    expect(fill.style.width).toBe('25%');
  });

  it('Cat 3/4 items include PSP name', () => {
    renderOpen({ category: 3, pspName: 'Tyro' });
    expect(screen.getByText(/Contact Tyro/)).toBeInTheDocument();
  });

  it('Cat 1/2 items include PSP name', () => {
    renderOpen({ category: 2, pspName: 'Square' });
    expect(screen.getByText(/Confirm IC pass-through with Square/)).toBeInTheDocument();
  });

  it('deadline dates use font-mono', () => {
    const { container } = renderOpen({ category: 4, pspName: 'Stripe' });
    const monoElements = container.querySelectorAll('.font-mono');
    // Progress counter + 5 deadline dates
    expect(monoElements.length).toBeGreaterThanOrEqual(5);
  });
});
