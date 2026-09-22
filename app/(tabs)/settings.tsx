import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { odometerReminder, useOdometerReadings } from '../../src/hooks/useOdometerReadings';
import { formatDate } from '../../src/lib/format';
import { colors, radius, shadowSm, spacing, type } from '../../src/lib/theme';
import { isAutoTrackingActive, startAutoTracking, stopAutoTracking } from '../../src/lib/backgroundLocationTask';
import { listPendingTrips } from '../../src/lib/pendingTrips';
import { isDemoMode } from '../../src/lib/demoMode';
import { resetDemoStore } from '../../src/lib/demoStore';
import { confirmAsync, notifyAsync } from '../../src/lib/confirm';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut, demoMode } = useAuth();
  const { readings, deleteReading, refresh: refreshReadings } = useOdometerReadings();
  const reminder = odometerReminder(readings);

  const handleResetDemoData = async () => {
    const confirmed = await confirmAsync(
      'Reset demo data?',
      'This restores the sample ventures, trips, and expenses back to their starting state.',
      'Reset'
    );
    if (!confirmed) return;
    resetDemoStore();
    refreshReadings();
  };

  const [autoTrackingOn, setAutoTrackingOn] = useState(false);
  const [autoTrackingBusy, setAutoTrackingBusy] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (isDemoMode()) return; // auto-tracking needs real device permissions; skip in web demo mode
      isAutoTrackingActive().then(setAutoTrackingOn);
      listPendingTrips().then((trips) => setPendingCount(trips.length));
    }, [])
  );

  const handleToggleAutoTracking = async (value: boolean) => {
    setAutoTrackingBusy(true);
    try {
      if (value) {
        const result = await startAutoTracking();
        if (result.error) {
          await notifyAsync('Couldn’t turn on automatic tracking', result.error);
          setAutoTrackingOn(false);
          return;
        }
        setAutoTrackingOn(true);
      } else {
        await stopAutoTracking();
        setAutoTrackingOn(false);
      }
    } finally {
      setAutoTrackingBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAsync('Delete reading?', undefined, 'Delete');
    if (confirmed) deleteReading(id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {demoMode ? (
        <View style={styles.demoBanner}>
          <Ionicons name="flask-outline" size={18} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.demoBannerText}>
              You're in Demo Mode. Sample data only — nothing here is saved, and it resets if you
              reload. Sign out to connect a real account.
            </Text>
            <Pressable style={styles.resetDemoButton} onPress={handleResetDemoData} hitSlop={6}>
              <Ionicons name="refresh" size={13} color="#92400E" />
              <Text style={styles.resetDemoButtonText}>Reset demo data</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {reminder ? (
        <View style={styles.reminderBanner}>
          <View style={styles.reminderIconWrap}>
            <Ionicons name="speedometer-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.reminderText}>{reminder}</Text>
          <Pressable style={styles.reminderButton} onPress={() => router.push('/odometer/new')}>
            <Text style={styles.reminderButtonText}>Log now</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>Automatic trip detection</Text>
      {demoMode ? (
        <View style={styles.infoCard}>
          <Ionicons name="navigate-outline" size={18} color={colors.textMuted} />
          <Text style={styles.infoCardText}>
            Not available in Demo Mode. On a real device, this watches your speed in the background
            and detects when you start and stop driving — no button required.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.toggleCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleCardTitle}>Auto-detect drives</Text>
                <Text style={styles.toggleCardBody}>
                  Watches your speed in the background and logs a drive automatically when you start
                  and stop moving. Off by default — uses more battery, and requires “Always
                  Allow” location access.
                </Text>
              </View>
              {autoTrackingBusy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Switch
                  value={autoTrackingOn}
                  onValueChange={handleToggleAutoTracking}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              )}
            </View>
          </View>
          <Text style={styles.hint}>
            Requires a standalone build (not Expo Go) to run reliably in the background — see the
            README for how to build one.
          </Text>
          {pendingCount > 0 ? (
            <Pressable style={styles.reminderBanner} onPress={() => router.push('/trip/pending')}>
              <View style={styles.reminderIconWrap}>
                <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.reminderText}>
                {pendingCount} detected {pendingCount === 1 ? 'trip' : 'trips'} waiting to be classified
              </Text>
              <View style={styles.reminderButton}>
                <Text style={styles.reminderButtonText}>Review</Text>
              </View>
            </Pressable>
          ) : null}
        </>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Odometer readings</Text>
        <Pressable style={styles.addLink} onPress={() => router.push('/odometer/new')} hitSlop={8}>
          <Ionicons name="add-circle" size={16} color={colors.primary} />
          <Text style={styles.addLinkText}>Add</Text>
        </Pressable>
      </View>

      {readings.length === 0 ? (
        <Text style={styles.hint}>
          No readings logged yet. Record your odometer on Jan 1 and Dec 31 each year to substantiate
          total annual mileage.
        </Text>
      ) : (
        <View style={styles.card}>
          {readings.map((r, i) => (
            <Pressable
              key={r.id}
              style={[styles.readingRow, i > 0 && styles.readingRowBorder]}
              onLongPress={() => handleDelete(r.id)}
            >
              <Text style={styles.readingDate}>{formatDate(r.date)}</Text>
              <Text style={styles.readingValue}>{r.reading.toLocaleString()} mi</Text>
            </Pressable>
          ))}
        </View>
      )}
      {readings.length > 0 ? <Text style={styles.hint}>Long-press a reading to delete it.</Text> : null}

      <Text style={styles.sectionLabel}>Notifications</Text>
      <View style={styles.infoCard}>
        <Ionicons name="notifications-off-outline" size={18} color={colors.textMuted} />
        <Text style={styles.infoCardText}>
          Off by default. This app only nudges you in-app near Jan 1 / Dec 31 — no push
          notifications, ever, unless you turn them on yourself.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.infoCard}>
        <Ionicons name="person-circle-outline" size={20} color={colors.textMuted} />
        <Text style={styles.infoCardText}>{demoMode ? 'Demo Mode (no account)' : session?.user.email}</Text>
      </View>
      <Pressable style={styles.signOutButton} onPress={() => signOut()}>
        <Ionicons name="log-out-outline" size={17} color={colors.danger} />
        <Text style={styles.signOutText}>{demoMode ? 'Exit Demo Mode' : 'Sign Out'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.warningMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  demoBannerText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
  },
  resetDemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  resetDemoButtonText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 12.5,
    textDecorationLine: 'underline',
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reminderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13.5,
    lineHeight: 18,
  },
  reminderButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  reminderButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  sectionLabel: {
    ...type.eyebrow,
    marginTop: spacing.xl,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xl,
  },
  addLinkText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13.5,
  },
  hint: {
    ...type.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    ...shadowSm,
  },
  toggleCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  toggleCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  toggleCardBody: {
    fontSize: 12.5,
    color: colors.textMuted,
    lineHeight: 17,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  readingRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  readingDate: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
  },
  readingValue: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadowSm,
  },
  infoCardText: {
    flex: 1,
    ...type.body,
    fontSize: 13.5,
    color: colors.textMuted,
    lineHeight: 18,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
  },
  signOutText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
