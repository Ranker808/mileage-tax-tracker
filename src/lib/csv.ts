import type { Expense, Trip, Venture } from '../types/database';
import { calculateDeduction, getMileageRateForDate } from './mileageRates';

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(',');
}

export function tripsToCsv(trips: Trip[], ventureById: Map<string, Venture>): string {
  const header = toRow([
    'Date',
    'Venture',
    'Start Location',
    'Destination',
    'Business Purpose',
    'Miles',
    'Rate/Mile',
    'Deduction',
  ]);
  const rows = trips.map((trip) => {
    let rate = 0;
    let deduction = 0;
    try {
      rate = getMileageRateForDate(trip.date);
      deduction = calculateDeduction(trip.miles, trip.date);
    } catch {
      // leave as 0 if no rate is configured for that date
    }
    return toRow([
      trip.date,
      ventureById.get(trip.venture_id)?.name ?? 'Unknown',
      trip.start_location,
      trip.end_location,
      trip.business_purpose,
      trip.miles,
      rate.toFixed(3),
      deduction.toFixed(2),
    ]);
  });
  return [header, ...rows].join('\n');
}

export function expensesToCsv(expenses: Expense[], ventureById: Map<string, Venture>): string {
  const header = toRow(['Date', 'Venture', 'Category', 'Amount', 'Notes', 'Has Receipt']);
  const rows = expenses.map((expense) =>
    toRow([
      expense.date,
      ventureById.get(expense.venture_id)?.name ?? 'Unknown',
      expense.category,
      expense.amount.toFixed(2),
      expense.notes ?? '',
      expense.receipt_photo_url ? 'Yes' : 'No',
    ])
  );
  return [header, ...rows].join('\n');
}
