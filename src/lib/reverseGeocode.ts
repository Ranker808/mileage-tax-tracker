import * as Location from 'expo-location';
import type { GeoPoint } from './gps';

/** Best-effort human-readable address for a GPS point; falls back to coordinates (e.g. reverse geocoding isn't supported on web). */
export async function bestEffortAddress(point: GeoPoint): Promise<string> {
  const fallback = `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
  try {
    const [result] = await Location.reverseGeocodeAsync(point);
    if (!result) return fallback;
    const street = [result.streetNumber, result.street].filter(Boolean).join(' ');
    const parts = [street || result.name, result.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : fallback;
  } catch {
    return fallback;
  }
}
