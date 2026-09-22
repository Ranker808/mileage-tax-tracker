import { describe, expect, it } from 'vitest';
import { odometerReminder } from './odometerReminder';
import type { OdometerReading } from '../types/database';

const reading = (date: string): OdometerReading => ({
  id: 'r1',
  user_id: 'u1',
  date,
  reading: 1000,
  created_at: date,
});

describe('odometerReminder', () => {
  it('nudges for the Jan 1 reading during the first two weeks of January when missing', () => {
    expect(odometerReminder([], new Date(2026, 0, 5))).toMatch(/Jan 1, 2026/);
  });

  it('does not nudge for Jan 1 once it has been logged on the exact date', () => {
    expect(odometerReminder([reading('2026-01-01')], new Date(2026, 0, 5))).toBeNull();
  });

  it('recognizes a reading logged a few days off the exact Jan 1 date (tolerance window)', () => {
    expect(odometerReminder([reading('2026-01-03')], new Date(2026, 0, 10))).toBeNull();
  });

  it('still nudges if the logged reading is too far outside the tolerance window', () => {
    expect(odometerReminder([reading('2026-01-20')], new Date(2026, 0, 10))).toMatch(/Jan 1, 2026/);
  });

  it('falls back to a generic get-started nudge once the Jan 1 window has passed with zero readings', () => {
    expect(odometerReminder([], new Date(2026, 0, 15))).toMatch(/Log an odometer reading/);
  });

  it('nudges for the Dec 31 reading in the last two weeks of December when missing', () => {
    expect(odometerReminder([], new Date(2026, 11, 20))).toMatch(/Dec 31, 2026/);
  });

  it('does not nudge for Dec 31 once it has been logged on the exact date', () => {
    expect(odometerReminder([reading('2026-12-31')], new Date(2026, 11, 20))).toBeNull();
  });

  it('recognizes a reading logged a few days off the exact Dec 31 date (tolerance window)', () => {
    expect(odometerReminder([reading('2026-12-28')], new Date(2026, 11, 20))).toBeNull();
  });

  it('nudges to start tracking when there are no readings at all, even outside the Jan/Dec windows', () => {
    expect(odometerReminder([], new Date(2026, 5, 15))).toMatch(/Log an odometer reading/);
  });

  it('is silent outside the Jan/Dec windows once at least one reading exists', () => {
    expect(odometerReminder([reading('2026-06-01')], new Date(2026, 5, 15))).toBeNull();
  });

  it("a reading logged for a different year does not suppress the current year's reminder", () => {
    expect(odometerReminder([reading('2025-01-01')], new Date(2026, 0, 5))).toMatch(/Jan 1, 2026/);
  });
});
