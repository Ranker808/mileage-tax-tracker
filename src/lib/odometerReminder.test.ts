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

  it('does not nudge for Jan 1 once it has been logged', () => {
    expect(odometerReminder([reading('2026-01-01')], new Date(2026, 0, 5))).toBeNull();
  });

  it('stops nudging for Jan 1 after the first two weeks of January', () => {
    expect(odometerReminder([], new Date(2026, 0, 15))).toBeNull();
  });

  it('nudges for the Dec 31 reading in the last two weeks of December when missing', () => {
    expect(odometerReminder([], new Date(2026, 11, 20))).toMatch(/Dec 31, 2026/);
  });

  it('does not nudge for Dec 31 once it has been logged', () => {
    expect(odometerReminder([reading('2026-12-31')], new Date(2026, 11, 20))).toBeNull();
  });

  it('is silent outside the Jan/Dec reminder windows', () => {
    expect(odometerReminder([], new Date(2026, 5, 15))).toBeNull();
  });

  it('a reading logged for a different year does not suppress the current year\'s reminder', () => {
    expect(odometerReminder([reading('2025-01-01')], new Date(2026, 0, 5))).toMatch(/Jan 1, 2026/);
  });
});
