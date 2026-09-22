import { formatCurrency, formatDate, formatMiles } from './format';
import { calculateDeduction, getMileageRateForDate } from './mileageRates';
import { EXPENSE_CATEGORY_META } from './expenseCategories';
import type { VentureRollup } from './reportCalculations';
import type { Expense, Trip, Venture } from '../types/database';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SHARED_STYLE = `
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 32px; color: #1a1d23; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 28px; margin-bottom: 8px; }
  .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; border-bottom: 2px solid #1a1d23; padding: 8px 6px; font-size: 12px; text-transform: uppercase; color: #6b7280; }
  td { padding: 8px 6px; border-bottom: 1px solid #e2e5ea; }
  td.num { text-align: right; }
  td.strong, th.num.strong { font-weight: 700; }
  tfoot td { font-weight: 700; border-top: 2px solid #1a1d23; border-bottom: none; }
  .footer { margin-top: 24px; font-size: 11px; color: #6b7280; }
  .empty { font-size: 13px; color: #6b7280; padding: 8px 6px; }
`;

function tripDetailRows(trips: Trip[], ventureById: Map<string, Venture>): string {
  if (trips.length === 0) {
    return '<div class="empty">No trips in this range.</div>';
  }
  const rows = [...trips]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((trip) => {
      let rate = 0;
      let deduction = 0;
      try {
        rate = getMileageRateForDate(trip.date);
        deduction = calculateDeduction(trip.miles, trip.date);
      } catch {
        // leave as 0 if no rate is configured for that date
      }
      return `
        <tr>
          <td>${escapeHtml(formatDate(trip.date))}</td>
          <td>${escapeHtml(ventureById.get(trip.venture_id)?.name ?? 'Unknown')}</td>
          <td>${escapeHtml(trip.start_location)} &rarr; ${escapeHtml(trip.end_location)}</td>
          <td>${escapeHtml(trip.business_purpose)}${trip.notes ? ` <span style="color:#6b7280">(${escapeHtml(trip.notes)})</span>` : ''}</td>
          <td class="num">${formatMiles(trip.miles)}</td>
          <td class="num">${rate.toFixed(3)}</td>
          <td class="num strong">${formatCurrency(deduction)}</td>
        </tr>`;
    })
    .join('');
  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Venture</th>
          <th>Route</th>
          <th>Purpose</th>
          <th class="num">Miles</th>
          <th class="num">Rate/Mi</th>
          <th class="num">Deduction</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function expenseDetailRows(expenses: Expense[], ventureById: Map<string, Venture>): string {
  if (expenses.length === 0) {
    return '<div class="empty">No expenses in this range.</div>';
  }
  const rows = [...expenses]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(
      (expense) => `
        <tr>
          <td>${escapeHtml(formatDate(expense.date))}</td>
          <td>${escapeHtml(ventureById.get(expense.venture_id)?.name ?? 'Unknown')}</td>
          <td>${escapeHtml(EXPENSE_CATEGORY_META[expense.category].label)}</td>
          <td>${expense.notes ? escapeHtml(expense.notes) : ''}</td>
          <td>${expense.receipt_photo_url ? 'Yes' : ''}</td>
          <td class="num strong">${formatCurrency(expense.amount)}</td>
        </tr>`
    )
    .join('');
  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Venture</th>
          <th>Category</th>
          <th>Notes</th>
          <th>Receipt</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** A complete, standalone tax-prep document: the per-venture P&L summary
 * plus full trip- and expense-level line items -- everything the CSV
 * export has, in one printable file. */
export function buildDetailedReportHtml(params: {
  title: string;
  rangeLabel: string;
  rollups: VentureRollup[];
  totals: Omit<VentureRollup, 'ventureId' | 'ventureName'>;
  trips: Trip[];
  expenses: Expense[];
  ventureById: Map<string, Venture>;
}): string {
  const { title, rangeLabel, rollups, totals, trips, expenses, ventureById } = params;

  const summaryRows = rollups
    .map(
      (r) => `
        <tr>
          <td>${escapeHtml(r.ventureName)}</td>
          <td class="num">${formatMiles(r.totalMiles)}</td>
          <td class="num">${formatCurrency(r.totalDeduction)}</td>
          <td class="num">${formatCurrency(r.totalExpenses)}</td>
          <td class="num strong">${formatCurrency(r.netDeductible)}</td>
        </tr>`
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${SHARED_STYLE}</style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="subtitle">${escapeHtml(rangeLabel)}</div>

        <h2>Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Venture</th>
              <th class="num">Miles</th>
              <th class="num">Mileage Deduction</th>
              <th class="num">Expenses</th>
              <th class="num">Net Deductible</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td class="num">${formatMiles(totals.totalMiles)}</td>
              <td class="num">${formatCurrency(totals.totalDeduction)}</td>
              <td class="num">${formatCurrency(totals.totalExpenses)}</td>
              <td class="num">${formatCurrency(totals.netDeductible)}</td>
            </tr>
          </tfoot>
        </table>

        <h2>Trips</h2>
        ${tripDetailRows(trips, ventureById)}

        <h2>Expenses</h2>
        ${expenseDetailRows(expenses, ventureById)}

        <div class="footer">Generated by Mileage &amp; Tax Tracker. Net Deductible = mileage deduction + logged expenses.</div>
      </body>
    </html>`;
}
