import { describe, it, expect } from 'vitest';
import { getCurrentPeriod, getRatesForPeriod } from '../periods';

describe('getCurrentPeriod', () => {
  it('returns pre_reform before 1 October 2026', () => {
    expect(getCurrentPeriod(new Date('2026-09-30T00:00:00Z'))).toBe('pre_reform');
  });

  it('returns post_oct_2026 on 1 October 2026', () => {
    expect(getCurrentPeriod(new Date('2026-10-01T00:00:00Z'))).toBe('post_oct_2026');
  });

  it('returns post_oct_2026 in mid-January 2027', () => {
    expect(getCurrentPeriod(new Date('2027-01-15T00:00:00Z'))).toBe('post_oct_2026');
  });

  it('returns post_apr_2027 on 1 April 2027', () => {
    expect(getCurrentPeriod(new Date('2027-04-01T00:00:00Z'))).toBe('post_apr_2027');
  });
});

describe('getRatesForPeriod', () => {
  it('projects Oct 2026 rates during pre-reform', () => {
    const pair = getRatesForPeriod(new Date('2026-04-01T00:00:00Z'));
    expect(pair.periodLabel.projected).toBe('Oct 2026');
    expect(pair.projected).not.toBeNull();
    expect(pair.projected!.consumerCreditPct).toBe(0.003);
  });

  it('projects Apr 2027 rates during post-Oct period', () => {
    const pair = getRatesForPeriod(new Date('2026-11-01T00:00:00Z'));
    expect(pair.periodLabel.projected).toBe('Apr 2027');
    expect(pair.projected).not.toBeNull();
    expect(pair.projected!.foreignPct).toBe(0.01);
  });

  it('has no projection after April 2027', () => {
    const pair = getRatesForPeriod(new Date('2027-06-01T00:00:00Z'));
    expect(pair.projected).toBeNull();
    expect(pair.periodLabel.projected).toBeNull();
  });
});
