import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadinessChecklist } from '@/components/results/sections/ReadinessChecklist';

describe('ReadinessChecklist', () => {
  it('renders section with correct id', () => {
    const { container } = render(<ReadinessChecklist category={4} pspName="Stripe" />);
    const section = container.querySelector('section');
    expect(section?.id).toBe('checklist');
    expect(section?.dataset.section).toBe('checklist');
  });

  it('Cat 3/4 renders 5 checklist items', () => {
    render(<ReadinessChecklist category={4} pspName="Stripe" />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
  });

  it('Cat 1/2 renders 4 checklist items', () => {
    render(<ReadinessChecklist category={1} pspName="Stripe" />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4);
  });

  it('all checkboxes start unchecked', () => {
    render(<ReadinessChecklist category={2} pspName="Square" />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });
  });

  it('checking a box updates progress', () => {
    render(<ReadinessChecklist category={1} pspName="Stripe" />);
    expect(screen.getByText('0/4')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]!);
    expect(screen.getByText('1/4')).toBeInTheDocument();
  });

  it('progress bar fill width updates', () => {
    const { container } = render(<ReadinessChecklist category={2} pspName="Stripe" />);
    const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement;
    expect(fill.style.width).toBe('0%');
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]!);
    // 1/4 = 25%
    expect(fill.style.width).toBe('25%');
  });

  it('Cat 3/4 items include PSP name', () => {
    render(<ReadinessChecklist category={3} pspName="Tyro" />);
    expect(screen.getByText(/Contact Tyro/)).toBeInTheDocument();
  });

  it('Cat 1/2 items include PSP name', () => {
    render(<ReadinessChecklist category={2} pspName="Square" />);
    expect(screen.getByText(/Confirm IC pass-through with Square/)).toBeInTheDocument();
  });

  it('deadline dates use font-mono', () => {
    const { container } = render(<ReadinessChecklist category={4} pspName="Stripe" />);
    const monoElements = container.querySelectorAll('.font-mono');
    // Progress counter + 5 deadline dates
    expect(monoElements.length).toBeGreaterThanOrEqual(5);
  });
});
