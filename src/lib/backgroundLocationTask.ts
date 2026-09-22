// Automatic ("no button") trip detection. This is the same technique
// MileIQ/Everlance use under the hood: there's no special OS API for
// "detect a drive" — it's continuous background location plus a speed
// threshold with debouncing (see DriveDetector in ./gps.ts).
//
// IMPORTANT: this requires a custom dev client / EAS build. Background
// location does not reliably run inside Expo Go on either platform, so
// this code cannot be verified from a sandboxed environment with no real
// device — it's written to Expo's documented pattern, but you are the
// one who has to confirm it actually detects a real drive on your phone.
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { DriveDetector, filterJitter, totalPathMiles, type GeoPoint } from './gps';
import { bestEffortAddress } from './reverseGeocode';
import { addPendingTrip } from './pendingTrips';
import { todayIso } from './format';

export const BACKGROUND_LOCATION_TASK = 'mileage-tracker-background-location';

const MIN_TRIP_MILES = 0.3;

let detector = new DriveDetector();
let currentTripPoints: GeoPoint[] = [];

async function finalizeTrip(): Promise<void> {
  const points = currentTripPoints;
  currentTripPoints = [];
  if (points.length < 2) return;

  const clean = filterJitter(points);
  if (clean.length < 2) return;

  const miles = totalPathMiles(clean);
  if (miles < MIN_TRIP_MILES) return; // too short to bother reviewing

  const first = clean[0];
  const last = clean[clean.length - 1];
  const [startAddress, endAddress] = await Promise.all([bestEffortAddress(first), bestEffortAddress(last)]);

  await addPendingTrip({
    date: todayIso(),
    start_location: startAddress,
    end_location: endAddress,
    miles: Math.round(miles * 100) / 100,
  });
}

// defineTask must run unconditionally at module load (imported once from
// the app's root layout), regardless of whether tracking is currently
// turned on — that's how Expo re-associates a background wake-up with
// this handler after the app was killed and relaunched by the OS.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[backgroundLocationTask]', error.message);
    return;
  }
  const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] };
  if (!locations) return;

  for (const loc of locations) {
    const point: GeoPoint = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    const event = detector.push({ timestamp: loc.timestamp, speedMps: loc.coords.speed });

    if (event?.type === 'started') {
      currentTripPoints = [point];
    } else if (detector.isDriving) {
      currentTripPoints.push(point);
    }

    if (event?.type === 'stopped') {
      await finalizeTrip();
    }
  }
});

export async function isAutoTrackingActive(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK).then((registered) =>
    registered ? Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK) : false
  );
}

export interface StartAutoTrackingResult {
  error: string | null;
}

export async function startAutoTracking(): Promise<StartAutoTrackingResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    return { error: 'Location permission is required for automatic trip detection.' };
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') {
    return {
      error:
        'Background location permission is required. On iOS, choose "Always Allow" for this app in Settings > Privacy > Location Services.',
    };
  }

  detector = new DriveDetector();
  currentTripPoints = [];

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 15_000,
    distanceInterval: 30,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'Mileage & Tax Tracker',
      notificationBody: 'Watching for drives to log automatically.',
    },
  });
  return { error: null };
}

export async function stopAutoTracking(): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (registered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
  currentTripPoints = [];
  detector = new DriveDetector();
}
