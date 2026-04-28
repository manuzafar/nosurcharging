import { describe, it, expect } from 'vitest';
import { getCategory } from '../categories';

describe('getCategory', () => {
  it('returns 1 for cost-plus + not surcharging', () => {
    expect(getCategory('costplus', false)).toBe(1);
  });

  it('returns 2 for flat rate + not surcharging', () => {
    expect(getCategory('flat', false)).toBe(2);
  });

  it('returns 3 for cost-plus + surcharging', () => {
    expect(getCategory('costplus', true)).toBe(3);
  });

  it('returns 4 for flat rate + surcharging', () => {
    expect(getCategory('flat', true)).toBe(4);
  });

  it('returns 5 for zero_cost (regardless of surcharging)', () => {
    expect(getCategory('zero_cost', false)).toBe(5);
  });

  it('returns 5 for zero_cost with surcharging=true (Amex separate)', () => {
    // Cat 5 short-circuits before the surcharging check — separate Amex
    // surcharge doesn't move the category.
    expect(getCategory('zero_cost', true)).toBe(5);
  });
});
