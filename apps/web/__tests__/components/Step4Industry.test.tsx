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

  // Step 4 simplification (May 2026 brief) — the per-tile AVT display
  // and the post-selection confirmation banner were both removed. The
  // calc engine still consumes AU_AVG_TXN_BY_INDUSTRY server-side; the
  // merchant just doesn't see it on this step.

  it('does not render any AVT dollar figure on the tiles', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    const text = document.body.textContent ?? '';
    // The previous render emitted "~$35 avg", "~$80 avg", etc. The new
    // tiles strip this entirely — `~$` should not appear anywhere on
    // the step.
    expect(text).not.toMatch(/~\$/);
    expect(text).not.toMatch(/avg/i);
  });

  it('does not render the post-selection confirmation banner', () => {
    render(
      <Step4Industry
        industry="cafe"
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    // The banner used these phrases verbatim — none should remain.
    expect(
      screen.queryByText(/as your average transaction value/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/tune action-list language/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/refine the exact figure in your results/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/cafés and restaurants/i)).not.toBeInTheDocument();
  });

  it('renders the new single-sentence subhead', () => {
    render(
      <Step4Industry
        industry={null}
        onIndustryChange={onIndustryChange}
        onNext={onNext}
        onBack={onBack}
      />,
    );
    expect(
      screen.getByText(
        /Tuning to your industry sharpens your estimate and your action plan/,
      ),
    ).toBeInTheDocument();
    // Old subhead's first sentence — superseded.
    expect(
      screen.queryByText(/Each industry has different transaction patterns/),
    ).not.toBeInTheDocument();
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
