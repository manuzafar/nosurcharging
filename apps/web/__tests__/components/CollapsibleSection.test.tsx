import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CollapsibleSection } from '@/components/results/CollapsibleSection';

function renderBasic(overrides?: { defaultOpen?: boolean }) {
  return render(
    <CollapsibleSection
      id="test-section"
      iconMark={<span aria-hidden>I</span>}
      iconTint="green"
      title="Test section"
      subtitle="A test subtitle"
      badge="3 items"
      defaultOpen={overrides?.defaultOpen}
    >
      <p>BODY_CONTENT</p>
    </CollapsibleSection>,
  );
}

describe('CollapsibleSection', () => {
  it('renders header with title, subtitle, and badge', () => {
    renderBasic();
    expect(screen.getByText('Test section')).toBeInTheDocument();
    expect(screen.getByText('A test subtitle')).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('outer section carries id and data-section', () => {
    const { container } = renderBasic();
    const section = container.querySelector('section');
    expect(section?.id).toBe('test-section');
    expect(section?.dataset.section).toBe('test-section');
  });

  it('body is hidden by default', () => {
    renderBasic();
    expect(screen.queryByText('BODY_CONTENT')).not.toBeInTheDocument();
  });

  it('clicking the header reveals the body', () => {
    renderBasic();
    fireEvent.click(screen.getByRole('button', { name: /test section/i }));
    expect(screen.getByText('BODY_CONTENT')).toBeInTheDocument();
  });

  it('clicking again hides the body', () => {
    renderBasic();
    const btn = screen.getByRole('button', { name: /test section/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText('BODY_CONTENT')).not.toBeInTheDocument();
  });

  it('aria-expanded reflects open state', () => {
    renderBasic();
    const btn = screen.getByRole('button', { name: /test section/i });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('respects defaultOpen=true on first paint', () => {
    renderBasic({ defaultOpen: true });
    expect(screen.getByText('BODY_CONTENT')).toBeInTheDocument();
  });
});
