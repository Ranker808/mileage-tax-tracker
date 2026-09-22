import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { filterJitter, totalPathMiles, type GeoPoint } from '../../src/lib/gps';
import { bestEffortAddress } from '../../src/lib/reverseGeocode';
import { formatMiles } from '../../src/lib/format';
import { colors, radius, shadow, spacing, type } from '../../src/lib/theme';
import { confirmAsync } from '../../src/lib/confirm';

type Status = 'requesting' | 'denied' | 'ready' | 'tracking' | 'finishing';

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TrackTrip() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('requesting');
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      setStatus(permStatus === 'granted' ? 'ready' : 'denied');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'tracking') return;
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  const handleStart = async () => {
    setPoints([]);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
    setStatus('tracking');
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 4000,
        distanceInterval: 15,
      },
      (location) => {
        setPoints((prev) => [...prev, { latitude: location.coords.latitude, longitude: location.coords.longitude }]);
      }
    );
  };

  const handleStop = async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    if (points.length < 2) {
      const discard = await confirmAsync(
        'Trip too short',
        'Not enough movement was recorded to log a trip.',
        'Discard',
        'Keep Trying'
      );
      if (discard) {
        router.back();
      } else {
        setStatus('tracking');
      }
      return;
    }

    setStatus('finishing');
    const clean = filterJitter(points);
    const miles = totalPathMiles(clean);
    const first = clean[0];
    const last = clean[clean.length - 1];

    const [startAddress, endAddress] = await Promise.all([bestEffortAddress(first), bestEffortAddress(last)]);

    router.replace({
      pathname: '/trip/new',
      params: {
        prefillStart: startAddress,
        prefillEnd: endAddress,
        prefillMiles: (Math.round(miles * 100) / 100).toString(),
      },
    });
  };

  const handleCancel = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    router.back();
  };

  if (status === 'requesting') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status === 'denied') {
    return (
      <View style={styles.center}>
        <Ionicons name="location-outline" size={40} color={colors.textFaint} />
        <Text style={styles.deniedTitle}>Location permission needed</Text>
        <Text style={styles.deniedBody}>
          To track a trip's route automatically, this app needs permission to use your location while
          it's open. You can still log trips manually without it.
        </Text>
        <Pressable style={styles.settingsButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </Pressable>
        <Pressable style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelLinkText}>Log manually instead</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'finishing') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.finishingText}>Working out your route…</Text>
      </View>
    );
  }

  const liveMiles = totalPathMiles(filterJitter(points));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>{status === 'tracking' ? 'Tracking' : 'Ready'}</Text>
        <Text style={styles.timer}>{formatElapsed(elapsedSeconds)}</Text>
        <View style={styles.milesRow}>
          <Ionicons name="speedometer-outline" size={18} color={colors.primary} />
          <Text style={styles.miles}>{formatMiles(Math.round(liveMiles * 100) / 100)}</Text>
        </View>
        {status === 'tracking' ? (
          <Text style={styles.hint}>Keep the app open while you drive — tracking pauses if you leave it.</Text>
        ) : (
          <Text style={styles.hint}>Tap Start when you're ready to go. We'll fill in the trip details from your route.</Text>
        )}
      </View>

      {status === 'ready' ? (
        <Pressable style={styles.startButton} onPress={handleStart}>
          <Ionicons name="play" size={22} color={colors.white} />
          <Text style={styles.startButtonText}>Start Tracking</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.stopButton} onPress={handleStop}>
          <Ionicons name="stop" size={20} color={colors.white} />
          <Text style={styles.startButtonText}>Stop &amp; Review</Text>
        </Pressable>
      )}

      <Pressable style={styles.cancelLink} onPress={handleCancel}>
        <Text style={styles.cancelLinkText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow,
  },
  cardEyebrow: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timer: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
    marginTop: spacing.sm,
  },
  milesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  miles: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  hint: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 17,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 16,
  },
  startButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  cancelLink: {
    marginTop: spacing.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelLinkText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  deniedTitle: {
    ...type.headline,
    marginTop: spacing.sm,
  },
  deniedBody: {
    ...type.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingsButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  settingsButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  finishingText: {
    ...type.body,
    color: colors.textMuted,
  },
});
