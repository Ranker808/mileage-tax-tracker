import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { odometerReminder, useOdometerReadings } from '../../src/hooks/useOdometerReadings';
import { formatDate } from '../../src/lib/format';
import { colors, radius, shadowSm, spacing, type } from '../../src/lib/theme';

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
          <Ionicons name="flask-outline" size={18} color={colors.warning} />
          <Text style={styles.demoBannerText}>
            You're in Demo Mode. Sample data only — nothing here is saved, and it resets if you
            reload. Sign out to connect a real account.
          </Text>
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
    flex: 1,
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
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
