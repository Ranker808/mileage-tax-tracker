export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function formatMiles(miles: number): string {
  return `${miles.toLocaleString('en-US', { maximumFractionDigits: 1 })} mi`;
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function startOfYearIso(date: Date = new Date()): string {
  return `${date.getFullYear()}-01-01`;
}
