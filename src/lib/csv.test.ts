import { describe, expect, it } from 'vitest';
import { expensesToCsv, tripsToCsv } from './csv';
import type { Expense, Trip, Venture } from '../types/database';

const ventureById = new Map<string, Venture>([
  ['v1', { id: 'v1', user_id: 'u1', name: 'DoorDash', active: true, created_at: '2026-01-01' }],
]);

describe('tripsToCsv', () => {
  it('produces a header row plus one row per trip with the correct deduction', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-01',
        start_location: 'Home',
        end_location: 'Client',
        business_purpose: 'Delivery',
        miles: 100,
        notes: null,
        created_at: '2026-01-01',
      },
    ];
    const csv = tripsToCsv(trips, ventureById);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Date,Venture,Start Location,Destination,Business Purpose,Miles,Rate/Mile,Deduction,Notes');
    expect(lines[1]).toBe('2026-01-01,DoorDash,Home,Client,Delivery,100,0.725,72.50,');
  });

  it('quotes fields containing commas and escapes embedded quotes', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-01',
        start_location: '123 Main St, Apt 4',
        end_location: 'Client "HQ"',
        business_purpose: 'Delivery',
        miles: 5,
        notes: null,
        created_at: '2026-01-01',
      },
    ];
    const csv = tripsToCsv(trips, ventureById);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('"123 Main St, Apt 4"');
    expect(dataLine).toContain('"Client ""HQ"""');
  });

  it('includes trip notes as the final column when present', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-01',
        start_location: 'Home',
        end_location: 'Client',
        business_purpose: 'Delivery',
        miles: 10,
        notes: 'Took the scenic route',
        created_at: '2026-01-01',
      },
    ];
    const dataLine = tripsToCsv(trips, ventureById).split('\n')[1];
    expect(dataLine.endsWith('Took the scenic route')).toBe(true);
  });

  it('falls back to "Unknown" for a venture id not in the map, and 0 rate for an unconfigured date', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        user_id: 'u1',
        venture_id: 'missing-venture',
        date: '2099-01-01',
        start_location: 'A',
        end_location: 'B',
        business_purpose: 'work',
        miles: 10,
        notes: null,
        created_at: '2099-01-01',
      },
    ];
    const dataLine = tripsToCsv(trips, ventureById).split('\n')[1];
    expect(dataLine).toContain('Unknown');
    expect(dataLine).toContain('0.000,0.00');
  });
});

describe('expensesToCsv', () => {
  it('produces a header row plus one row per expense', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-01',
        amount: 42.5,
        category: 'gas',
        receipt_photo_url: 'some/path.jpg',
        notes: 'Fill up',
        created_at: '2026-01-01',
      },
    ];
    const csv = expensesToCsv(expenses, ventureById);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Date,Venture,Category,Amount,Notes,Has Receipt');
    expect(lines[1]).toBe('2026-01-01,DoorDash,Gas,42.50,Fill up,Yes');
  });

  it('marks a receipt-less expense as "No" and handles null notes as empty', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-01',
        amount: 10,
        category: 'other',
        receipt_photo_url: null,
        notes: null,
        created_at: '2026-01-01',
      },
    ];
    const dataLine = expensesToCsv(expenses, ventureById).split('\n')[1];
    expect(dataLine).toBe('2026-01-01,DoorDash,Other,10.00,,No');
  });
});
