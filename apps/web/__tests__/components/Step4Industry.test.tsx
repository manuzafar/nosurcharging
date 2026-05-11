import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step4Industry } from '@/components/assessment/Step4Industry';

describe('Step4Industry', () => {
  const onIndustryChange = vi.fn();
  const onNext = vi.fn();
  const onBack = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 6 industry tiles', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    const industries = [
      'Cafe / Restaurant',
      'Hospitality group',
      'Retail',
      'Online store',
      'Ticketing / Events',
      'Other',
    ];
    for (const label of industries) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('clicking a tile selects it', async () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByText('Retail'));
    expect(onIndustryChange).toHaveBeenCalledWith('retail');
  });

  it('clicking another tile deselects the first', async () => {
    const { rerender } = render(
      <Step4Industry
        industry="retail"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    await user.click(screen.getByText('Online store'));
    expect(onIndustryChange).toHaveBeenCalledWith('online');

    // Rerender with new selection — only the online tile should be checked.
    rerender(
      <Step4Industry
        industry="online"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    expect(screen.getByRole('radio', { name: /online store/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /^retail/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('only one tile can be selected at a time', () => {
    render(
      <Step4Industry
        industry="cafe"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );

    const checkedRadios = screen
      .getAllByRole('radio')
      .filter((btn) => btn.getAttribute('aria-checked') === 'true');
    expect(checkedRadios).toHaveLength(1);
  });

  it('renders the AVT signal on every tile from AU_AVG_TXN_BY_INDUSTRY', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    // Defaults sourced from packages/calculations/constants/au.ts so the
    // displayed assumption can't drift from the calculation engine.
    expect(screen.getByText('~$35 avg')).toBeInTheDocument(); // cafe
    expect(screen.getByText('~$80 avg')).toBeInTheDocument(); // hospitality
    expect(screen.getByText('~$95 avg')).toBeInTheDocument(); // online
    expect(screen.getByText('~$120 avg')).toBeInTheDocument(); // ticketing
    // retail + other both default to 65 — there should be two of them
    expect(screen.getAllByText('~$65 avg').length).toBeGreaterThanOrEqual(2);
  });

  it('inline info note hidden until a tile is selected', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(screen.queryByText(/as your average transaction value/i)).not.toBeInTheDocument();
  });

  it('inline info note appears with AVT + industry phrase on selection', () => {
    const { rerender } = render(
      <Step4Industry
        industry="cafe"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(screen.getByText(/cafés and restaurants/i)).toBeInTheDocument();
    expect(screen.getByText(/as your average transaction value/i)).toBeInTheDocument();

    // Switching selection updates the note (no stale state).
    rerender(
      <Step4Industry
        industry="ticketing"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(screen.getByText(/ticketing and events/i)).toBeInTheDocument();
    expect(screen.queryByText(/cafés and restaurants/i)).not.toBeInTheDocument();
  });

  it('See my results button disabled when no industry selected', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(screen.getByRole('button', { name: /see my results/i })).toBeDisabled();
  });

  it('See my results button enabled when industry selected', () => {
    render(
      <Step4Industry
        industry="cafe"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(screen.getByRole('button', { name: /see my results/i })).toBeEnabled();
  });
});
