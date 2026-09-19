import type { OdometerReading } from '../types/database';

/** Returns whether a Jan 1 or Dec 31 reading is missing for the current year, near those dates. */
export function odometerReminder(readings: OdometerReading[], today: Date = new Date()): string | null {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const date = today.getDate();

  const hasReading = (isoDate: string) => readings.some((r) => r.date === isoDate);

  // Nudge for the Jan 1 (start-of-year) reading during the first two weeks of January.
  if (month === 0 && date <= 14) {
    const jan1 = `${year}-01-01`;
    if (!hasReading(jan1)) {
      return `Don't forget to log your Jan 1, ${year} odometer reading — the IRS wants your start-of-year mileage.`;
    }
  }

  // Nudge for the Dec 31 (end-of-year) reading during the last two weeks of December.
  if (month === 11 && date >= 17) {
    const dec31 = `${year}-12-31`;
    if (!hasReading(dec31)) {
      return `Year-end is coming up — log your Dec 31, ${year} odometer reading for your records.`;
    }
  }

  return null;
}
