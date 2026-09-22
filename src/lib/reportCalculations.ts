import { calculateDeduction } from './mileageRates';
import type { Expense, ExpenseCategory, Trip, Venture } from '../types/database';

export interface VentureRollup {
  ventureId: string;
  ventureName: string;
  totalMiles: number;
  totalDeduction: number;
  totalExpenses: number;
  netDeductible: number;
  tripCount: number;
  expenseCount: number;
}

export function computeVentureRollups(
  ventures: Venture[],
  trips: Trip[],
  expenses: Expense[]
): VentureRollup[] {
  const byVenture = new Map<string, VentureRollup>();

  for (const venture of ventures) {
    byVenture.set(venture.id, {
      ventureId: venture.id,
      ventureName: venture.name,
      totalMiles: 0,
      totalDeduction: 0,
      totalExpenses: 0,
      netDeductible: 0,
      tripCount: 0,
      expenseCount: 0,
    });
  }

  for (const trip of trips) {
    let rollup = byVenture.get(trip.venture_id);
    if (!rollup) {
      rollup = {
        ventureId: trip.venture_id,
        ventureName: 'Unknown venture',
        totalMiles: 0,
        totalDeduction: 0,
        totalExpenses: 0,
        netDeductible: 0,
        tripCount: 0,
        expenseCount: 0,
      };
      byVenture.set(trip.venture_id, rollup);
    }
    rollup.totalMiles += trip.miles;
    let deduction = 0;
    try {
      deduction = calculateDeduction(trip.miles, trip.date);
    } catch {
      deduction = 0;
    }
    rollup.totalDeduction += deduction;
    rollup.tripCount += 1;
  }

  for (const expense of expenses) {
    let rollup = byVenture.get(expense.venture_id);
    if (!rollup) {
      rollup = {
        ventureId: expense.venture_id,
        ventureName: 'Unknown venture',
        totalMiles: 0,
        totalDeduction: 0,
        totalExpenses: 0,
        netDeductible: 0,
        tripCount: 0,
        expenseCount: 0,
      };
      byVenture.set(expense.venture_id, rollup);
    }
    rollup.totalExpenses += expense.amount;
    rollup.expenseCount += 1;
  }

  for (const rollup of byVenture.values()) {
    rollup.totalMiles = Math.round(rollup.totalMiles * 100) / 100;
    rollup.totalDeduction = Math.round(rollup.totalDeduction * 100) / 100;
    rollup.totalExpenses = Math.round(rollup.totalExpenses * 100) / 100;
    rollup.netDeductible = Math.round((rollup.totalDeduction + rollup.totalExpenses) * 100) / 100;
  }

  return Array.from(byVenture.values()).sort((a, b) => b.netDeductible - a.netDeductible);
}

export function sumRollups(rollups: VentureRollup[]): Omit<VentureRollup, 'ventureId' | 'ventureName'> {
  return rollups.reduce(
    (acc, r) => ({
      totalMiles: Math.round((acc.totalMiles + r.totalMiles) * 100) / 100,
      totalDeduction: Math.round((acc.totalDeduction + r.totalDeduction) * 100) / 100,
      totalExpenses: Math.round((acc.totalExpenses + r.totalExpenses) * 100) / 100,
      netDeductible: Math.round((acc.netDeductible + r.netDeductible) * 100) / 100,
      tripCount: acc.tripCount + r.tripCount,
      expenseCount: acc.expenseCount + r.expenseCount,
    }),
    { totalMiles: 0, totalDeduction: 0, totalExpenses: 0, netDeductible: 0, tripCount: 0, expenseCount: 0 }
  );
}

export interface MonthlyRollup {
  month: string; // YYYY-MM
  label: string; // e.g. "Jan 2026"
  totalMiles: number;
  totalDeduction: number;
}

/** Groups trips by calendar month (of their own date, not "today"),
 * chronologically, for the Reports trend chart. */
export function groupTripsByMonth(trips: Trip[]): MonthlyRollup[] {
  const byMonth = new Map<string, MonthlyRollup>();

  for (const trip of trips) {
    const month = trip.date.slice(0, 7);
    let rollup = byMonth.get(month);
    if (!rollup) {
      const [year, m] = month.split('-').map(Number);
      const label = new Date(year, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      rollup = { month, label, totalMiles: 0, totalDeduction: 0 };
      byMonth.set(month, rollup);
    }
    rollup.totalMiles += trip.miles;
    try {
      rollup.totalDeduction += calculateDeduction(trip.miles, trip.date);
    } catch {
      // leave as-is if no rate is configured for that date
    }
  }

  for (const rollup of byMonth.values()) {
    rollup.totalMiles = Math.round(rollup.totalMiles * 100) / 100;
    rollup.totalDeduction = Math.round(rollup.totalDeduction * 100) / 100;
  }

  return Array.from(byMonth.values()).sort((a, b) => (a.month < b.month ? -1 : 1));
}

export interface CategoryRollup {
  category: ExpenseCategory;
  total: number;
}

/** Groups expenses by category, largest first, for the Reports category
 * breakdown chart. Only categories that were actually logged appear. */
export function groupExpensesByCategory(expenses: Expense[]): CategoryRollup[] {
  const byCategory = new Map<ExpenseCategory, number>();
  for (const expense of expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amount);
  }
  return Array.from(byCategory.entries())
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}
