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
});
