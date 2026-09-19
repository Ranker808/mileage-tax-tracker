import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { odometerReminder, useOdometerReadings } from '../../src/hooks/useOdometerReadings';
import { formatDate } from '../../src/lib/format';
import { colors } from '../../src/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut, demoMode } = useAuth();
  const { readings, deleteReading } = useOdometerReadings();
  const reminder = odometerReminder(readings);

  const handleDelete = (id: string) => {
    Alert.alert('Delete reading?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReading(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {demoMode ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            You're in Demo Mode. Sample data only — nothing here is saved, and it resets if you
            reload. Sign out to connect a real account.
          </Text>
        </View>
      ) : null}

      {reminder ? (
        <View style={styles.reminderBanner}>
          <Text style={styles.reminderText}>{reminder}</Text>
          <Pressable style={styles.reminderButton} onPress={() => router.push('/odometer/new')}>
            <Text style={styles.reminderButtonText}>Log Now</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Odometer Readings</Text>
        <Pressable onPress={() => router.push('/odometer/new')}>
          <Text style={styles.addLink}>+ Add</Text>
        </Pressable>
      </View>

      {readings.length === 0 ? (
        <Text style={styles.hint}>
          No readings logged yet. Record your odometer on Jan 1 and Dec 31 each year to substantiate
          total annual mileage.
        </Text>
      ) : (
        readings.map((r) => (
          <Pressable key={r.id} style={styles.readingRow} onLongPress={() => handleDelete(r.id)}>
            <Text style={styles.readingDate}>{formatDate(r.date)}</Text>
            <Text style={styles.readingValue}>{r.reading.toLocaleString()} mi</Text>
          </Pressable>
        ))
      )}
      {readings.length > 0 ? <Text style={styles.hint}>Long-press a reading to delete it.</Text> : null}

      <Text style={styles.sectionLabel}>Notifications</Text>
      <Text style={styles.hint}>
        Off by default. This app only nudges you in-app near Jan 1 / Dec 31 — no push notifications,
        ever, unless you turn them on yourself.
      </Text>

      <Text style={styles.sectionLabel}>Account</Text>
      <Text style={styles.hint}>{demoMode ? 'Demo Mode (no account)' : session?.user.email}</Text>
      <Pressable style={styles.signOutButton} onPress={() => signOut()}>
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
    padding: 16,
    paddingBottom: 48,
  },
  demoBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  demoBannerText: {
    color: '#92400e',
    fontSize: 13,
    lineHeight: 18,
  },
  reminderBanner: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  reminderText: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 10,
  },
  reminderButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reminderButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  addLink: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: 20,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 18,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 8,
  },
  readingDate: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  readingValue: {
    fontSize: 14,
    color: colors.textMuted,
  },
  signOutButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
