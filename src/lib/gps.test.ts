import { describe, expect, it } from 'vitest';
import { DriveDetector, DRIVE_DETECTION_DEFAULTS, filterJitter, haversineMiles, totalPathMiles } from './gps';

describe('haversineMiles', () => {
  it('is zero for identical points', () => {
    expect(haversineMiles({ latitude: 40.7128, longitude: -74.006 }, { latitude: 40.7128, longitude: -74.006 })).toBe(0);
  });

  it('matches a known real-world distance: NYC to Philadelphia (~80 miles straight-line)', () => {
    const nyc = { latitude: 40.7128, longitude: -74.006 };
    const philly = { latitude: 39.9526, longitude: -75.1652 };
    const miles = haversineMiles(nyc, philly);
    expect(miles).toBeGreaterThan(78);
    expect(miles).toBeLessThan(82);
  });

  it('matches a known real-world distance: SF to LA (~347 miles straight-line)', () => {
    const sf = { latitude: 37.7749, longitude: -122.4194 };
    const la = { latitude: 34.0522, longitude: -118.2437 };
    const miles = haversineMiles(sf, la);
    expect(miles).toBeGreaterThan(340);
    expect(miles).toBeLessThan(355);
  });

  it('is symmetric', () => {
    const a = { latitude: 40.0, longitude: -75.0 };
    const b = { latitude: 41.0, longitude: -74.0 };
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 10);
  });
});

describe('totalPathMiles', () => {
  it('is zero for 0 or 1 points', () => {
    expect(totalPathMiles([])).toBe(0);
    expect(totalPathMiles([{ latitude: 1, longitude: 1 }])).toBe(0);
  });

  it('sums consecutive segments, not a straight line between endpoints', () => {
    // An L-shaped path: 1 degree of latitude, then 1 degree of longitude.
    // The summed path must be longer than a straight diagonal between the
    // same start and end points.
    const path = [
      { latitude: 0, longitude: 0 },
      { latitude: 1, longitude: 0 },
      { latitude: 1, longitude: 1 },
    ];
    const summed = totalPathMiles(path);
    const straightLine = haversineMiles(path[0], path[2]);
    expect(summed).toBeGreaterThan(straightLine);
  });
});

describe('filterJitter', () => {
  it('drops points that are closer together than the noise threshold', () => {
    const base = { latitude: 40.0, longitude: -75.0 };
    // A tiny jitter of ~1 meter, well under the default 8m threshold.
    const jitter = { latitude: 40.000005, longitude: -75.0 };
    const filtered = filterJitter([base, jitter, jitter, base]);
    expect(filtered).toHaveLength(1);
  });

  it('keeps points that represent real movement', () => {
    const points = [
      { latitude: 40.0, longitude: -75.0 },
      { latitude: 40.001, longitude: -75.0 }, // ~111m away
      { latitude: 40.002, longitude: -75.0 }, // another ~111m
    ];
    expect(filterJitter(points)).toHaveLength(3);
  });

  it('returns an empty array for an empty input', () => {
    expect(filterJitter([])).toEqual([]);
  });
});

describe('DriveDetector', () => {
  const T0 = 1_700_000_000_000;

  it('does not start on a brief burst of speed (e.g. a quick jog)', () => {
    const detector = new DriveDetector();
    const event = detector.push({ timestamp: T0, speedMps: 10 });
    expect(event).toBeNull();
    expect(detector.isDriving).toBe(false);
  });

  it('starts only after sustained driving speed for startConfirmMs', () => {
    const detector = new DriveDetector();
    detector.push({ timestamp: T0, speedMps: 10 });
    const tooSoon = detector.push({
      timestamp: T0 + DRIVE_DETECTION_DEFAULTS.startConfirmMs - 1000,
      speedMps: 10,
    });
    expect(tooSoon).toBeNull();

    const confirmed = detector.push({
      timestamp: T0 + DRIVE_DETECTION_DEFAULTS.startConfirmMs + 1000,
      speedMps: 10,
    });
    expect(confirmed).toEqual({ type: 'started', at: T0 + DRIVE_DETECTION_DEFAULTS.startConfirmMs + 1000 });
    expect(detector.isDriving).toBe(true);
  });

  it('resets the "above threshold" timer if speed drops before confirmation (a red light while accelerating)', () => {
    const detector = new DriveDetector();
    detector.push({ timestamp: T0, speedMps: 10 });
    detector.push({ timestamp: T0 + 30_000, speedMps: 0 }); // dropped back below threshold
    const stillNotStarted = detector.push({
      timestamp: T0 + 61_000,
      speedMps: 10,
    });
    // Only 31s of sustained speed since the reset, not enough to confirm.
    expect(stillNotStarted).toBeNull();
  });

  it('does not stop for a brief red light, only after sustained low speed for stopConfirmMs', () => {
    const detector = new DriveDetector();
    detector.push({ timestamp: T0, speedMps: 10 });
    detector.push({ timestamp: T0 + DRIVE_DETECTION_DEFAULTS.startConfirmMs + 1000, speedMps: 10 });
    expect(detector.isDriving).toBe(true);

    const stopStart = T0 + DRIVE_DETECTION_DEFAULTS.startConfirmMs + 1000;
    const briefStop = detector.push({ timestamp: stopStart + 20_000, speedMps: 0 });
    expect(briefStop).toBeNull();
    expect(detector.isDriving).toBe(true); // still driving through a red light

    // Speed picks back up before the stop is confirmed.
    detector.push({ timestamp: stopStart + 25_000, speedMps: 12 });
    expect(detector.isDriving).toBe(true);
  });

  it('stops after sustained near-zero speed for stopConfirmMs', () => {
    const detector = new DriveDetector();
    detector.push({ timestamp: T0, speedMps: 10 });
    const startedAt = T0 + DRIVE_DETECTION_DEFAULTS.startConfirmMs + 1000;
    detector.push({ timestamp: startedAt, speedMps: 10 });
    expect(detector.isDriving).toBe(true);

    detector.push({ timestamp: startedAt + 5000, speedMps: 0 });
    const event = detector.push({
      timestamp: startedAt + 5000 + DRIVE_DETECTION_DEFAULTS.stopConfirmMs,
      speedMps: 0,
    });
    expect(event).toEqual({ type: 'stopped', at: startedAt + 5000 + DRIVE_DETECTION_DEFAULTS.stopConfirmMs });
    expect(detector.isDriving).toBe(false);
  });

  it('treats a null speed sample as stopped (0 mph), not as "still driving"', () => {
    const detector = new DriveDetector();
    detector.push({ timestamp: T0, speedMps: 10 });
    const startedAt = T0 + DRIVE_DETECTION_DEFAULTS.startConfirmMs + 1000;
    detector.push({ timestamp: startedAt, speedMps: 10 });
    expect(detector.isDriving).toBe(true);

    detector.push({ timestamp: startedAt + 1000, speedMps: null });
    const event = detector.push({
      timestamp: startedAt + 1000 + DRIVE_DETECTION_DEFAULTS.stopConfirmMs,
      speedMps: null,
    });
    expect(event?.type).toBe('stopped');
  });

  it('respects custom thresholds passed to the constructor', () => {
    const detector = new DriveDetector({ startConfirmMs: 1000, stopConfirmMs: 1000, drivingSpeedMps: 2 });
    detector.push({ timestamp: T0, speedMps: 3 });
    const event = detector.push({ timestamp: T0 + 1500, speedMps: 3 });
    expect(event).toEqual({ type: 'started', at: T0 + 1500 });
  });
});
