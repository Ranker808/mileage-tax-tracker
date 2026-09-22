import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../src/components/EmptyState';
import { listPendingTrips, removePendingTrip, type PendingTrip } from '../../src/lib/pendingTrips';
import { formatDate, formatMiles } from '../../src/lib/format';
import { colors, radius, shadowSm, spacing, type } from '../../src/lib/theme';
import { confirmAsync } from '../../src/lib/confirm';

export default function PendingTripsScreen() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    listPendingTrips()
      .then(setPending)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleDiscard = async (trip: PendingTrip) => {
    const confirmed = await confirmAsync(
      'Discard this trip?',
      'It was detected automatically — discarding it will not affect anything else.',
      'Discard'
    );
    if (!confirmed) return;
    await removePendingTrip(trip.id);
    refresh();
  };

  const handleClassify = (trip: PendingTrip) => {
    router.push({
      pathname: '/trip/new',
      params: {
        pendingId: trip.id,
        prefillStart: trip.start_location,
        prefillEnd: trip.end_location,
        prefillMiles: String(trip.miles),
      },
    });
  };

  if (!loading && pending.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="Nothing to review"
          message="Drives detected automatically will show up here for you to assign a venture and purpose."
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={pending}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <Text style={styles.headerHint}>
          Tap a detected drive to assign it to a venture — or discard it if it wasn't a business trip.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => handleClassify(item)}>
          <View style={styles.cardTop}>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
            <Pressable onPress={() => handleDiscard(item)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textFaint} />
            </Pressable>
          </View>
          <View style={styles.routeRow}>
            <Text style={styles.route} numberOfLines={1}>
              {item.start_location}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textFaint} style={{ marginHorizontal: 6 }} />
            <Text style={styles.route} numberOfLines={1}>
              {item.end_location}
            </Text>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.miles}>{formatMiles(item.miles)}</Text>
            <View style={styles.classifyButton}>
              <Text style={styles.classifyButtonText}>Classify</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  headerHint: {
    ...type.body,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadowSm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  date: {
    ...type.caption,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  route: {
    ...type.headline,
    fontSize: 15,
    flexShrink: 1,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  miles: {
    fontSize: 13.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  classifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  classifyButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13.5,
  },
});
