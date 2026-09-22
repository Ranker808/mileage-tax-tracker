// Locally-stored, unclassified trips detected by background auto-tracking.
// They live in AsyncStorage (not Supabase) because we don't yet know which
// venture or business purpose they belong to — exactly the "swipe to
// classify" step MileIQ is best known for. A pending trip only becomes a
// real trip once the user reviews it and fills those in.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mileage-tracker:pending-trips';

export interface PendingTrip {
  id: string;
  date: string; // YYYY-MM-DD
  start_location: string;
  end_location: string;
  miles: number;
  detectedAt: string; // ISO timestamp
}

async function readAll(): Promise<PendingTrip[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(trips: PendingTrip[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export async function listPendingTrips(): Promise<PendingTrip[]> {
  const trips = await readAll();
  return [...trips].sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
}

export async function addPendingTrip(entry: Omit<PendingTrip, 'id' | 'detectedAt'>): Promise<PendingTrip> {
  const trips = await readAll();
  const trip: PendingTrip = {
    ...entry,
    id: `pending-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    detectedAt: new Date().toISOString(),
  };
  await writeAll([...trips, trip]);
  return trip;
}

export async function removePendingTrip(id: string): Promise<void> {
  const trips = await readAll();
  await writeAll(trips.filter((t) => t.id !== id));
}
