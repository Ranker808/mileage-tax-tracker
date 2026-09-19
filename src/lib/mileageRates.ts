// IRS standard mileage rates by effective date range. A trip's rate is
// determined by its own date, so add new periods here as the IRS
// publishes them (including mid-year splits like 2026's).
export interface MileageRatePeriod {
  label: string;
  startDate: string; // inclusive, YYYY-MM-DD
  endDate: string; // inclusive, YYYY-MM-DD
  ratePerMile: number; // dollars per business mile
}

export const MILEAGE_RATE_SCHEDULE: MileageRatePeriod[] = [
  { label: '2026 Jan–Jun', startDate: '2026-01-01', endDate: '2026-06-30', ratePerMile: 0.725 },
  { label: '2026 Jul–Dec', startDate: '2026-07-01', endDate: '2026-12-31', ratePerMile: 0.76 },
];

export function getMileageRatePeriod(dateStr: string): MileageRatePeriod | undefined {
  return MILEAGE_RATE_SCHEDULE.find((p) => dateStr >= p.startDate && dateStr <= p.endDate);
}

export function getMileageRateForDate(dateStr: string): number {
  const period = getMileageRatePeriod(dateStr);
  if (!period) {
    throw new Error(
      `No mileage rate configured for ${dateStr}. Add a period to MILEAGE_RATE_SCHEDULE in src/lib/mileageRates.ts.`
    );
  }
  return period.ratePerMile;
}

export function calculateDeduction(miles: number, dateStr: string): number {
  const rate = getMileageRateForDate(dateStr);
  return Math.round(miles * rate * 100) / 100;
}
