import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DepthToggle } from '@/components/results/DepthToggle';

describe('DepthToggle', () => {
  it('renders the label "Understand your numbers"', () => {
    render(
      <DepthToggle>
        <p>hidden child</p>
      </DepthToggle>,
    );
    expect(screen.getByText(/Understand your numbers/i)).toBeInTheDocument();
  });

  it('is collapsed by default — children are NOT in the DOM', () => {
    render(
      <DepthToggle>
        <p data-testid="depth-child">hidden child</p>
      </DepthToggle>,
    );
    expect(screen.queryByTestId('depth-child')).not.toBeInTheDocument();
  });

  it('button has aria-expanded=false when collapsed', () => {
    render(
      <DepthToggle>
        <p>hidden child</p>
      </DepthToggle>,
    );
    const button = screen.getByRole('button', { name: /Understand your numbers/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking the button expands the panel and reveals children', () => {
    render(
      <DepthToggle>
        <p data-testid="depth-child">visible child</p>
      </DepthToggle>,
    );
    const button = screen.getByRole('button', { name: /Understand your numbers/i });
    fireEvent.click(button);

    expect(screen.getByTestId('depth-child')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('clicking the button a second time collapses the panel', () => {
    render(
      <DepthToggle>
        <p data-testid="depth-child">visible child</p>
      </DepthToggle>,
    );
    const button = screen.getByRole('button', { name: /Understand your numbers/i });

    fireEvent.click(button);
    expect(screen.getByTestId('depth-child')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByTestId('depth-child')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('aria-controls points at the panel id when expanded', () => {
    render(
      <DepthToggle>
        <p>visible child</p>
      </DepthToggle>,
    );
    const button = screen.getByRole('button', { name: /Understand your numbers/i });
    fireEvent.click(button);

    const controlsId = button.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();

    const panel = screen.getByRole('region', { name: /Detailed cost breakdown/i });
    expect(panel.id).toBe(controlsId);
  });

  it('respects defaultOpen=true — children visible on first render', () => {
    render(
      <DepthToggle defaultOpen>
        <p data-testid="depth-child">visible child</p>
      </DepthToggle>,
    );
    expect(screen.getByTestId('depth-child')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Understand your numbers/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('panel has role="region" with an aria-label when open', () => {
    render(
      <DepthToggle defaultOpen>
        <p>visible child</p>
      </DepthToggle>,
    );
    const panel = screen.getByRole('region', { name: /Detailed cost breakdown/i });
    expect(panel).toBeInTheDocument();
  });
});
