import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CollapsibleSection } from '@/components/results/CollapsibleSection';

beforeEach(() => {
  window.localStorage.clear();
});

function renderBasic(overrides?: { defaultOpen?: boolean; storageKey?: string }) {
  return render(
    <CollapsibleSection
      id="test-section"
      storageKey={overrides?.storageKey ?? 'test.section.key'}
      iconMark="📋"
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

  it('persists open state to localStorage under storageKey', () => {
    renderBasic({ storageKey: 'persist.me' });
    fireEvent.click(screen.getByRole('button', { name: /test section/i }));
    expect(window.localStorage.getItem('persist.me')).toBe('1');
  });

  it('hydrates from localStorage on mount', () => {
    window.localStorage.setItem('hydrate.key', '1');
    renderBasic({ storageKey: 'hydrate.key' });
    // Body should be visible without any click
    expect(screen.getByText('BODY_CONTENT')).toBeInTheDocument();
  });

  it('aria-expanded reflects open state', () => {
    renderBasic();
    const btn = screen.getByRole('button', { name: /test section/i });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('respects defaultOpen=true on first paint when no localStorage entry', () => {
    renderBasic({ defaultOpen: true, storageKey: 'fresh.key' });
    expect(screen.getByText('BODY_CONTENT')).toBeInTheDocument();
  });
});
