// Pure GPS math: no expo-location import here on purpose, so this stays
// unit-testable in plain Node (see gps.test.ts) and reusable by both the
// manual Start/Stop tracker and the background auto-detector.

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_MILES = 3958.7613;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two points, in miles. */
export function haversineMiles(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_MILES * c;
}

/** Sums the haversine distance between consecutive points along a route. */
export function totalPathMiles(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMiles(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Drops GPS noise: points spaced closer than minMeters apart (typical
 * GPS jitter while stationary) are discarded so a parked car doesn't
 * silently rack up phantom mileage.
 */
export function filterJitter(points: GeoPoint[], minMeters = 8): GeoPoint[] {
  if (points.length === 0) return [];
  const kept: GeoPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = kept[kept.length - 1];
    const distanceMeters = haversineMiles(last, points[i]) * 1609.344;
    if (distanceMeters >= minMeters) {
      kept.push(points[i]);
    }
  }
  return kept;
}

// ---------------------------------------------------------------------
// Drive detection: turns a stream of speed samples into start/stop
// events, the same way MileIQ/Everlance-style "automatic" tracking works
// under the hood (there is no magic — it's a speed threshold with
// debouncing so red lights and short walks to the car don't trigger it).
// ---------------------------------------------------------------------

export const DRIVE_DETECTION_DEFAULTS = {
  /** Sustained speed above this suggests driving, not walking. ~10 mph. */
  drivingSpeedMps: 4.47,
  /** Speed below this suggests stopped/parked. ~2.2 mph. */
  stoppedSpeedMps: 1.0,
  /** How long above drivingSpeedMps before we confirm "trip started". */
  startConfirmMs: 60_000,
  /** How long below stoppedSpeedMps before we confirm "trip ended". */
  stopConfirmMs: 180_000,
};

export interface SpeedSample {
  timestamp: number; // ms epoch
  speedMps: number | null; // null when the GPS fix doesn't include speed
}

export type DriveEvent = { type: 'started'; at: number } | { type: 'stopped'; at: number };

interface DetectorOptions {
  drivingSpeedMps?: number;
  stoppedSpeedMps?: number;
  startConfirmMs?: number;
  stopConfirmMs?: number;
}

/**
 * Stateful, debounced driving detector. Feed it samples in order via
 * `push()`; it returns a DriveEvent when a start or stop is confirmed,
 * or null otherwise. One instance per tracking session.
 */
export class DriveDetector {
  private readonly opts: Required<DetectorOptions>;
  private driving = false;
  private aboveThresholdSince: number | null = null;
  private belowThresholdSince: number | null = null;

  constructor(options: DetectorOptions = {}) {
    this.opts = { ...DRIVE_DETECTION_DEFAULTS, ...options };
  }

  get isDriving(): boolean {
    return this.driving;
  }

  push(sample: SpeedSample): DriveEvent | null {
    const speed = sample.speedMps ?? 0;

    if (!this.driving) {
      if (speed >= this.opts.drivingSpeedMps) {
        if (this.aboveThresholdSince === null) this.aboveThresholdSince = sample.timestamp;
        if (sample.timestamp - this.aboveThresholdSince >= this.opts.startConfirmMs) {
          this.driving = true;
          this.aboveThresholdSince = null;
          this.belowThresholdSince = null;
          return { type: 'started', at: sample.timestamp };
        }
      } else {
        this.aboveThresholdSince = null;
      }
      return null;
    }

    // Currently driving: watch for a sustained stop.
    if (speed <= this.opts.stoppedSpeedMps) {
      if (this.belowThresholdSince === null) this.belowThresholdSince = sample.timestamp;
      if (sample.timestamp - this.belowThresholdSince >= this.opts.stopConfirmMs) {
        this.driving = false;
        this.aboveThresholdSince = null;
        this.belowThresholdSince = null;
        return { type: 'stopped', at: sample.timestamp };
      }
    } else {
      this.belowThresholdSince = null;
    }
    return null;
  }
}
