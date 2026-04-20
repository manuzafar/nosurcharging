import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollSpy } from '@/hooks/useScrollSpy';

describe('useScrollSpy', () => {
  let observeCallback: IntersectionObserverCallback | null = null;

  beforeEach(() => {
    observeCallback = null;

    // Replace IntersectionObserver to capture the callback
    window.IntersectionObserver = class MockIO {
      constructor(cb: IntersectionObserverCallback) {
        observeCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [] as number[];
    } as unknown as typeof IntersectionObserver;

    // Mock getElementById to return null (sections not in DOM during test)
    vi.spyOn(document, 'getElementById').mockReturnValue(null);
  });

  it('returns "overview" as default active section', () => {
    const { result } = renderHook(() => useScrollSpy());
    expect(result.current.activeSection).toBe('overview');
  });

  it('returns scrollToSection as a function', () => {
    const { result } = renderHook(() => useScrollSpy());
    expect(typeof result.current.scrollToSection).toBe('function');
  });

  it('updates activeSection when IntersectionObserver fires', () => {
    const { result } = renderHook(() => useScrollSpy());

    expect(observeCallback).not.toBeNull();

    // Simulate the observer firing with "actions" section visible
    act(() => {
      observeCallback!(
        [
          {
            target: { id: 'actions' } as unknown as Element,
            intersectionRatio: 0.5,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(result.current.activeSection).toBe('actions');
  });

  it('scrollToSection calls scrollIntoView', () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(document, 'getElementById').mockReturnValue({
      scrollIntoView: scrollIntoView,
    } as unknown as HTMLElement);

    const { result } = renderHook(() => useScrollSpy());
    result.current.scrollToSection('values');

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
