import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatMiles, startOfYearIso, todayIso } from './format';

describe('formatCurrency', () => {
  it('formats as USD with two decimals', () => {
    expect(formatCurrency(42.5)).toBe('$42.50');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
});

describe('formatMiles', () => {
  it('appends "mi" and rounds to at most one decimal', () => {
    expect(formatMiles(8.4)).toBe('8.4 mi');
    expect(formatMiles(100)).toBe('100 mi');
  });
});

describe('formatDate', () => {
  it('parses YYYY-MM-DD as a local calendar date, not shifted by a day via UTC parsing', () => {
    // A naive `new Date('2026-01-01')` parses as UTC midnight, which can
    // display as Dec 31 in negative-UTC-offset timezones. formatDate must
    // avoid that off-by-one.
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
    expect(formatDate('2026-12-31')).toBe('Dec 31, 2026');
  });
});

describe('todayIso', () => {
  it('returns a YYYY-MM-DD string matching the current local date', () => {
    const iso = todayIso();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    expect(iso).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    );
  });
});

describe('startOfYearIso', () => {
  it('returns Jan 1 of the given date\'s year', () => {
    expect(startOfYearIso(new Date(2026, 8, 19))).toBe('2026-01-01');
  });
});
