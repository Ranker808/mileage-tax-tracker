import { describe, expect, it } from 'vitest';
import { buildDetailedReportHtml } from './pdfReport';
import type { Expense, Trip, Venture } from '../types/database';

const ventureById = new Map<string, Venture>([
  ['v1', { id: 'v1', user_id: 'u1', name: 'DoorDash', active: true, created_at: '2026-01-01' }],
]);

const totals = { totalMiles: 100, totalDeduction: 72.5, totalExpenses: 20, netDeductible: 92.5, tripCount: 1, expenseCount: 1 };

const rollups = [
  { ventureId: 'v1', ventureName: 'DoorDash', totalMiles: 100, totalDeduction: 72.5, totalExpenses: 20, netDeductible: 92.5, tripCount: 1, expenseCount: 1 },
];

describe('buildDetailedReportHtml', () => {
  it('includes the venture summary table', () => {
    const html = buildDetailedReportHtml({
      title: 'Test Report',
      rangeLabel: '2026',
      rollups,
      totals,
      trips: [],
      expenses: [],
      ventureById,
    });
    expect(html).toContain('DoorDash');
    expect(html).toContain('$92.50');
  });

  it('includes trip line items with route, purpose, and deduction', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-15',
        start_location: 'Home',
        end_location: 'Client HQ',
        business_purpose: 'Delivery',
        miles: 100,
        notes: 'Took the scenic route',
        created_at: '2026-01-15',
      },
    ];
    const html = buildDetailedReportHtml({
      title: 'Test Report',
      rangeLabel: '2026',
      rollups,
      totals,
      trips,
      expenses: [],
      ventureById,
    });
    expect(html).toContain('Home');
    expect(html).toContain('Client HQ');
    expect(html).toContain('Delivery');
    expect(html).toContain('Took the scenic route');
    expect(html).toContain('$72.50');
  });

  it('includes expense line items with category label and amount', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-15',
        amount: 42.5,
        category: 'parking_tolls',
        receipt_photo_url: null,
        notes: null,
        created_at: '2026-01-15',
      },
    ];
    const html = buildDetailedReportHtml({
      title: 'Test Report',
      rangeLabel: '2026',
      rollups,
      totals,
      trips: [],
      expenses,
      ventureById,
    });
    expect(html).toContain('Parking &amp; Tolls');
    expect(html).toContain('$42.50');
  });

  it('shows an empty-state message instead of an empty table when there are no trips/expenses', () => {
    const html = buildDetailedReportHtml({
      title: 'Test Report',
      rangeLabel: '2026',
      rollups: [],
      totals: { totalMiles: 0, totalDeduction: 0, totalExpenses: 0, netDeductible: 0, tripCount: 0, expenseCount: 0 },
      trips: [],
      expenses: [],
      ventureById,
    });
    expect(html).toContain('No trips in this range.');
    expect(html).toContain('No expenses in this range.');
  });

  it('escapes HTML in user-provided text to prevent injection into the generated document', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        user_id: 'u1',
        venture_id: 'v1',
        date: '2026-01-15',
        start_location: '<script>alert(1)</script>',
        end_location: 'B',
        business_purpose: 'work',
        miles: 10,
        notes: null,
        created_at: '2026-01-15',
      },
    ];
    const html = buildDetailedReportHtml({
      title: 'Test Report',
      rangeLabel: '2026',
      rollups,
      totals,
      trips,
      expenses: [],
      ventureById,
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
