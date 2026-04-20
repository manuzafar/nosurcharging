import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TalkToCustomers } from '@/components/results/sections/TalkToCustomers';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('TalkToCustomers', () => {
  it('renders section with correct id', () => {
    const { container } = render(<TalkToCustomers category={4} pspName="Stripe" />);
    const section = container.querySelector('section');
    expect(section?.id).toBe('customers');
    expect(section?.dataset.section).toBe('customers');
  });

  it('renders all 4 template tabs', () => {
    render(<TalkToCustomers category={2} pspName="Stripe" />);
    expect(screen.getByText('Customer email')).toBeInTheDocument();
    expect(screen.getByText('Counter sign')).toBeInTheDocument();
    expect(screen.getByText('Social media')).toBeInTheDocument();
    expect(screen.getByText('Staff briefing')).toBeInTheDocument();
  });

  it('defaults to email tab', () => {
    render(<TalkToCustomers category={3} pspName="Tyro" />);
    expect(screen.getByText(/Dear valued customer/)).toBeInTheDocument();
  });

  it('switches to counter sign tab', () => {
    render(<TalkToCustomers category={4} pspName="Stripe" />);
    fireEvent.click(screen.getByText('Counter sign'));
    expect(screen.getByText(/NOTICE TO CUSTOMERS/)).toBeInTheDocument();
  });

  it('switches to social media tab', () => {
    render(<TalkToCustomers category={3} pspName="Stripe" />);
    fireEvent.click(screen.getByText('Social media'));
    expect(screen.getByText(/#nosurcharging/)).toBeInTheDocument();
  });

  it('switches to staff briefing tab', () => {
    render(<TalkToCustomers category={2} pspName="Square" />);
    fireEvent.click(screen.getByText('Staff briefing'));
    expect(screen.getByText(/STAFF BRIEFING/)).toBeInTheDocument();
  });

  it('copy button shows "Copied!" after click', async () => {
    render(<TalkToCustomers category={2} pspName="Stripe" />);
    const btn = screen.getByText('Copy to clipboard');
    fireEvent.click(btn);
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('Cat 3/4 email emphasises surcharge removal', () => {
    render(<TalkToCustomers category={3} pspName="Tyro" />);
    expect(screen.getByText(/no longer be adding a surcharge/)).toBeInTheDocument();
  });

  it('Cat 1/2 email uses general reform language', () => {
    render(<TalkToCustomers category={1} pspName="Stripe" />);
    expect(screen.getByText(/new Reserve Bank of Australia regulations/)).toBeInTheDocument();
  });

  it('interpolates PSP name in staff briefing', () => {
    render(<TalkToCustomers category={4} pspName="Tyro" />);
    fireEvent.click(screen.getByText('Staff briefing'));
    expect(screen.getByText(/Tyro/)).toBeInTheDocument();
  });
});
