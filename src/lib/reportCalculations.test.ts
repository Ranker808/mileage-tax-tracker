import { describe, expect, it } from 'vitest';
import { computeVentureRollups, sumRollups } from './reportCalculations';
import type { Expense, Trip, Venture } from '../types/database';

const ventures: Venture[] = [
  { id: 'v1', user_id: 'u1', name: 'DoorDash', active: true, created_at: '2026-01-01' },
  { id: 'v2', user_id: 'u1', name: 'Notary', active: true, created_at: '2026-01-01' },
];

function trip(overrides: Partial<Trip>): Trip {
  return {
    id: 't1',
    user_id: 'u1',
    venture_id: 'v1',
    date: '2026-01-15',
    start_location: 'A',
    end_location: 'B',
    business_purpose: 'work',
    miles: 10,
    notes: null,
    created_at: '2026-01-15',
    ...overrides,
  };
}

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    user_id: 'u1',
    venture_id: 'v1',
    date: '2026-01-15',
    amount: 10,
    category: 'gas',
    receipt_photo_url: null,
    notes: null,
    created_at: '2026-01-15',
    ...overrides,
  };
}

describe('computeVentureRollups', () => {
  it('includes every active venture even with zero activity', () => {
    const rollups = computeVentureRollups(ventures, [], []);
    expect(rollups).toHaveLength(2);
    expect(rollups.every((r) => r.totalMiles === 0 && r.netDeductible === 0)).toBe(true);
  });

  it('sums miles and mileage deduction per venture using each trip\'s own rate', () => {
    const trips = [
      trip({ id: 't1', venture_id: 'v1', miles: 100, date: '2026-01-01' }), // H1 rate 0.725 -> 72.5
      trip({ id: 't2', venture_id: 'v1', miles: 100, date: '2026-08-01' }), // H2 rate 0.76 -> 76
    ];
    const rollups = computeVentureRollups(ventures, trips, []);
    const doorDash = rollups.find((r) => r.ventureId === 'v1')!;
    expect(doorDash.totalMiles).toBe(200);
    expect(doorDash.totalDeduction).toBe(148.5);
    expect(doorDash.tripCount).toBe(2);
  });

  it('sums expenses per venture separately from mileage', () => {
    const expenses = [
      expense({ id: 'e1', venture_id: 'v2', amount: 50 }),
      expense({ id: 'e2', venture_id: 'v2', amount: 25.5 }),
    ];
    const rollups = computeVentureRollups(ventures, [], expenses);
    const notary = rollups.find((r) => r.ventureId === 'v2')!;
    expect(notary.totalExpenses).toBe(75.5);
    expect(notary.expenseCount).toBe(2);
  });

  it('net deductible is mileage deduction plus expenses', () => {
    const trips = [trip({ venture_id: 'v1', miles: 100, date: '2026-01-01' })]; // 72.5
    const expenses = [expense({ venture_id: 'v1', amount: 27.5 })];
    const rollups = computeVentureRollups(ventures, trips, expenses);
    const doorDash = rollups.find((r) => r.ventureId === 'v1')!;
    expect(doorDash.netDeductible).toBe(100);
  });

  it('does not silently drop a trip/expense that references an unknown venture', () => {
    const trips = [trip({ venture_id: 'ghost', miles: 10, date: '2026-01-01' })];
    const rollups = computeVentureRollups(ventures, trips, []);
    const ghost = rollups.find((r) => r.ventureId === 'ghost');
    expect(ghost).toBeDefined();
    expect(ghost!.ventureName).toBe('Unknown venture');
    expect(ghost!.totalMiles).toBe(10);
  });

  it('a trip on a date with no configured mileage rate contributes 0 deduction, not a thrown error', () => {
    const trips = [trip({ venture_id: 'v1', miles: 100, date: '2099-01-01' })];
    expect(() => computeVentureRollups(ventures, trips, [])).not.toThrow();
    const rollups = computeVentureRollups(ventures, trips, []);
    const doorDash = rollups.find((r) => r.ventureId === 'v1')!;
    expect(doorDash.totalDeduction).toBe(0);
    expect(doorDash.totalMiles).toBe(100); // miles are still tracked even if the rate is unknown
  });

  it('sorts rollups by net deductible descending', () => {
    const trips = [
      trip({ id: 't1', venture_id: 'v1', miles: 10, date: '2026-01-01' }), // small
      trip({ id: 't2', venture_id: 'v2', miles: 1000, date: '2026-01-01' }), // big
    ];
    const rollups = computeVentureRollups(ventures, trips, []);
    expect(rollups[0].ventureId).toBe('v2');
    expect(rollups[1].ventureId).toBe('v1');
  });
});

describe('sumRollups', () => {
  it('sums totals across ventures', () => {
    const rollups = computeVentureRollups(
      ventures,
      [
        trip({ id: 't1', venture_id: 'v1', miles: 100, date: '2026-01-01' }),
        trip({ id: 't2', venture_id: 'v2', miles: 50, date: '2026-01-01' }),
      ],
      [expense({ id: 'e1', venture_id: 'v1', amount: 20 })]
    );
    const totals = sumRollups(rollups);
    expect(totals.totalMiles).toBe(150);
    expect(totals.totalDeduction).toBe(108.75); // (100 + 50) * 0.725
    expect(totals.totalExpenses).toBe(20);
    expect(totals.tripCount).toBe(2);
    expect(totals.expenseCount).toBe(1);
  });

  it('returns all zeros for an empty list', () => {
    expect(sumRollups([])).toEqual({
      totalMiles: 0,
      totalDeduction: 0,
      totalExpenses: 0,
      netDeductible: 0,
      tripCount: 0,
      expenseCount: 0,
    });
  });
});
