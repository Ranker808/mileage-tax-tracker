import { calculateDeduction } from './mileageRates';
import type { Expense, ExpenseCategory, Income, Trip, Venture } from '../types/database';

export interface VentureRollup {
  ventureId: string;
  ventureName: string;
  totalMiles: number;
  totalDeduction: number;
  totalExpenses: number;
  netDeductible: number;
  totalIncome: number;
  businessProfit: number;
  tripCount: number;
  expenseCount: number;
  incomeCount: number;
}

function emptyRollup(ventureId: string, ventureName: string): VentureRollup {
  return {
    ventureId,
    ventureName,
    totalMiles: 0,
    totalDeduction: 0,
    totalExpenses: 0,
    netDeductible: 0,
    totalIncome: 0,
    businessProfit: 0,
    tripCount: 0,
    expenseCount: 0,
    incomeCount: 0,
  };
}

export function computeVentureRollups(
  ventures: Venture[],
  trips: Trip[],
  expenses: Expense[],
  income: Income[] = []
): VentureRollup[] {
  const byVenture = new Map<string, VentureRollup>();

  for (const venture of ventures) {
    byVenture.set(venture.id, emptyRollup(venture.id, venture.name));
  }

  for (const trip of trips) {
    let rollup = byVenture.get(trip.venture_id);
    if (!rollup) {
      rollup = emptyRollup(trip.venture_id, 'Unknown venture');
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
      rollup = emptyRollup(expense.venture_id, 'Unknown venture');
      byVenture.set(expense.venture_id, rollup);
    }
    rollup.totalExpenses += expense.amount;
    rollup.expenseCount += 1;
  }

  for (const entry of income) {
    let rollup = byVenture.get(entry.venture_id);
    if (!rollup) {
      rollup = emptyRollup(entry.venture_id, 'Unknown venture');
      byVenture.set(entry.venture_id, rollup);
    }
    rollup.totalIncome += entry.amount;
    rollup.incomeCount += 1;
  }

  for (const rollup of byVenture.values()) {
    rollup.totalMiles = Math.round(rollup.totalMiles * 100) / 100;
    rollup.totalDeduction = Math.round(rollup.totalDeduction * 100) / 100;
    rollup.totalExpenses = Math.round(rollup.totalExpenses * 100) / 100;
    rollup.totalIncome = Math.round(rollup.totalIncome * 100) / 100;
    rollup.netDeductible = Math.round((rollup.totalDeduction + rollup.totalExpenses) * 100) / 100;
    // Business profit is real cash flow (income - expenses); the mileage
    // deduction is a tax construct, not a cost you actually paid, so it's
    // deliberately excluded here even though it's part of netDeductible.
    rollup.businessProfit = Math.round((rollup.totalIncome - rollup.totalExpenses) * 100) / 100;
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
      totalIncome: Math.round((acc.totalIncome + r.totalIncome) * 100) / 100,
      businessProfit: Math.round((acc.businessProfit + r.businessProfit) * 100) / 100,
      tripCount: acc.tripCount + r.tripCount,
      expenseCount: acc.expenseCount + r.expenseCount,
      incomeCount: acc.incomeCount + r.incomeCount,
    }),
    {
      totalMiles: 0,
      totalDeduction: 0,
      totalExpenses: 0,
      netDeductible: 0,
      totalIncome: 0,
      businessProfit: 0,
      tripCount: 0,
      expenseCount: 0,
      incomeCount: 0,
    }
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
