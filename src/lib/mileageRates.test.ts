import { describe, expect, it } from 'vitest';
import { calculateDeduction, getMileageRateForDate, getMileageRatePeriod, MILEAGE_RATE_SCHEDULE } from './mileageRates';

describe('mileageRates', () => {
  it('returns the H1 2026 rate for dates in Jan-Jun', () => {
    expect(getMileageRateForDate('2026-01-01')).toBe(0.725);
    expect(getMileageRateForDate('2026-03-15')).toBe(0.725);
    expect(getMileageRateForDate('2026-06-30')).toBe(0.725);
  });

  it('returns the H2 2026 rate for dates in Jul-Dec, with no gap at the boundary', () => {
    expect(getMileageRateForDate('2026-07-01')).toBe(0.76);
    expect(getMileageRateForDate('2026-09-15')).toBe(0.76);
    expect(getMileageRateForDate('2026-12-31')).toBe(0.76);
  });

  it('the two 2026 periods are contiguous with no gap or overlap', () => {
    const [h1, h2] = MILEAGE_RATE_SCHEDULE;
    expect(h1.endDate).toBe('2026-06-30');
    expect(h2.startDate).toBe('2026-07-01');
  });

  it('throws for a date outside the configured schedule', () => {
    expect(() => getMileageRateForDate('2027-01-01')).toThrow(/No mileage rate configured/);
    expect(() => getMileageRateForDate('2025-12-31')).toThrow();
  });

  it('getMileageRatePeriod returns undefined (not throw) for out-of-range dates', () => {
    expect(getMileageRatePeriod('2030-01-01')).toBeUndefined();
  });

  it('calculates the deduction as miles * rate, rounded to cents', () => {
    expect(calculateDeduction(100, '2026-01-15')).toBe(72.5);
    expect(calculateDeduction(100, '2026-08-01')).toBe(76);
    // 8.4 * 0.725 = 6.09 exactly
    expect(calculateDeduction(8.4, '2026-03-01')).toBe(6.09);
  });

  it('rounds fractional cents correctly instead of truncating', () => {
    // 33.333 * 0.725 = 24.166425 -> rounds to 24.17, not 24.16
    expect(calculateDeduction(33.333, '2026-01-01')).toBe(24.17);
  });

  it('throws (does not silently return 0) for an unconfigured date', () => {
    expect(() => calculateDeduction(100, '2030-01-01')).toThrow();
  });
});
