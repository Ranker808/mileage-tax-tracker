import { describe, expect, it } from 'vitest';
import { computeVentureRollups, groupExpensesByCategory, groupTripsByMonth, sumRollups } from './reportCalculations';
import type { Expense, Income, Trip, Venture } from '../types/database';

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

function income(overrides: Partial<Income>): Income {
  return {
    id: 'i1',
    user_id: 'u1',
    venture_id: 'v1',
    date: '2026-01-15',
    amount: 100,
    source: 'Test payout',
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

  it('business profit is income minus expenses, excluding the mileage deduction', () => {
    const trips = [trip({ venture_id: 'v1', miles: 100, date: '2026-01-01' })]; // 72.5 deduction -- not cash
    const expenses = [expense({ venture_id: 'v1', amount: 30 })];
    const incomeEntries = [income({ venture_id: 'v1', amount: 500 })];
    const rollups = computeVentureRollups(ventures, trips, expenses, incomeEntries);
    const doorDash = rollups.find((r) => r.ventureId === 'v1')!;
    expect(doorDash.totalIncome).toBe(500);
    expect(doorDash.businessProfit).toBe(470); // 500 - 30, NOT minus the 72.5 mileage deduction
    expect(doorDash.incomeCount).toBe(1);
  });

  it('income for a venture with no logged income defaults to zero, not undefined/NaN', () => {
    const rollups = computeVentureRollups(ventures, [], []);
    expect(rollups.every((r) => r.totalIncome === 0 && r.businessProfit === 0)).toBe(true);
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
      [expense({ id: 'e1', venture_id: 'v1', amount: 20 })],
      [income({ id: 'i1', venture_id: 'v1', amount: 200 })]
    );
    const totals = sumRollups(rollups);
    expect(totals.totalMiles).toBe(150);
    expect(totals.totalDeduction).toBe(108.75); // (100 + 50) * 0.725
    expect(totals.totalExpenses).toBe(20);
    expect(totals.totalIncome).toBe(200);
    expect(totals.businessProfit).toBe(180); // 200 income - 20 expenses
    expect(totals.tripCount).toBe(2);
    expect(totals.expenseCount).toBe(1);
    expect(totals.incomeCount).toBe(1);
  });

  it('returns all zeros for an empty list', () => {
    expect(sumRollups([])).toEqual({
      totalMiles: 0,
      totalDeduction: 0,
      totalExpenses: 0,
      netDeductible: 0,
      totalIncome: 0,
      businessProfit: 0,
      tripCount: 0,
      expenseCount: 0,
      incomeCount: 0,
    });
  });
});

describe('groupTripsByMonth', () => {
  it('sums miles and deduction per calendar month, sorted chronologically', () => {
    const trips = [
      trip({ id: 't1', date: '2026-02-10', miles: 50 }), // H1 rate 0.725
      trip({ id: 't2', date: '2026-01-05', miles: 100 }),
      trip({ id: 't3', date: '2026-01-20', miles: 20 }),
    ];
    const rollups = groupTripsByMonth(trips);
    expect(rollups.map((r) => r.month)).toEqual(['2026-01', '2026-02']);
    expect(rollups[0].totalMiles).toBe(120);
    expect(rollups[0].totalDeduction).toBe(87); // 120 * 0.725
    expect(rollups[1].totalMiles).toBe(50);
  });

  it('returns an empty list for no trips', () => {
    expect(groupTripsByMonth([])).toEqual([]);
  });

  it('a trip on a date with no configured rate contributes 0 deduction without throwing', () => {
    const trips = [trip({ date: '2099-01-01', miles: 100 })];
    expect(() => groupTripsByMonth(trips)).not.toThrow();
    expect(groupTripsByMonth(trips)[0].totalDeduction).toBe(0);
  });
});

describe('groupExpensesByCategory', () => {
  it('sums amounts per category, largest first', () => {
    const expenses = [
      expense({ id: 'e1', category: 'gas', amount: 30 }),
      expense({ id: 'e2', category: 'insurance', amount: 100 }),
      expense({ id: 'e3', category: 'gas', amount: 20 }),
    ];
    const rollups = groupExpensesByCategory(expenses);
    expect(rollups).toEqual([
      { category: 'insurance', total: 100 },
      { category: 'gas', total: 50 },
    ]);
  });

  it('only includes categories that were actually logged', () => {
    const rollups = groupExpensesByCategory([expense({ category: 'other', amount: 5 })]);
    expect(rollups).toEqual([{ category: 'other', total: 5 }]);
  });

  it('returns an empty list for no expenses', () => {
    expect(groupExpensesByCategory([])).toEqual([]);
  });
});
