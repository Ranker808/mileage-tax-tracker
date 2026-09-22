import type { OdometerReading } from '../types/database';

// How close a logged reading's date has to be to a year boundary to count
// as "the" start/end-of-year reading — logging on Jan 3 instead of the
// literal Jan 1 shouldn't make the reminder nag forever.
const BOUNDARY_TOLERANCE_DAYS = 7;

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(a.getTime() - b.getTime()) / 86_400_000);
}

function hasReadingNear(readings: OdometerReading[], target: Date): boolean {
  return readings.some((r) => {
    const [y, m, d] = r.date.split('-').map(Number);
    return daysBetween(new Date(y, m - 1, d), target) <= BOUNDARY_TOLERANCE_DAYS;
  });
}

/**
 * Returns a reminder message, or null if none is due right now.
 *
 * Near Jan 1 / Dec 31 each year, nudges for that specific boundary reading
 * if nothing close enough to it has been logged. Outside those windows, a
 * user with zero readings ever still gets a gentle one-time nudge to start
 * the habit, rather than the app staying silent for the other ten months
 * of the year.
 */
export function odometerReminder(readings: OdometerReading[], today: Date = new Date()): string | null {
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const date = today.getDate();

  if (month === 0 && date <= 14) {
    if (!hasReadingNear(readings, new Date(year, 0, 1))) {
      return `Don't forget to log your Jan 1, ${year} odometer reading — the IRS wants your start-of-year mileage.`;
    }
  }

  if (month === 11 && date >= 17) {
    if (!hasReadingNear(readings, new Date(year, 11, 31))) {
      return `Year-end is coming up — log your Dec 31, ${year} odometer reading for your records.`;
    }
  }

  if (readings.length === 0) {
    return 'Log an odometer reading to start tracking your annual mileage for tax records.';
  }

  return null;
}
