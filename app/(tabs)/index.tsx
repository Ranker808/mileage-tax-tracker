import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips } from '../../src/hooks/useTrips';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { VenturePickerModal } from '../../src/components/VenturePickerModal';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate, formatMiles } from '../../src/lib/format';
import { calculateDeduction } from '../../src/lib/mileageRates';
import { colors, radius, shadow, shadowSm, spacing, type, ventureAccent } from '../../src/lib/theme';
import type { Trip } from '../../src/types/database';

export default function TripsScreen() {
  const router = useRouter();
  const { ventures } = useVentures();
  const [ventureFilter, setVentureFilter] = useState<string | null>(null);
  const { trips, loading, refresh, reassignVenture } = useTrips({ ventureId: ventureFilter });
  const [reassignTarget, setReassignTarget] = useState<Trip | null>(null);

  const ventureById = useMemo(() => {
    const map = new Map(ventures.map((v) => [v.id, v]));
    return map;
  }, [ventures]);

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <VentureChipRow
          ventures={ventures}
          selectedId={ventureFilter}
          onSelect={setVentureFilter}
          includeAllOption
          onSelectAll={() => setVentureFilter(null)}
        />
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={trips.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title="No trips yet"
            message="Log your first business trip to start tracking your mileage deduction."
          />
        }
        renderItem={({ item }) => {
          const venture = ventureById.get(item.venture_id);
          const accent = ventureAccent(venture?.name ?? '');
          const deduction = calculateDeduction(item.miles, item.date);
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/trip/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Pressable
                  style={[styles.ventureBadge, { backgroundColor: accent.bg }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setReassignTarget(item);
                  }}
                  hitSlop={6}
                >
                  <Text style={[styles.ventureBadgeText, { color: accent.fg }]}>
                    {venture?.name ?? 'Unknown'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={accent.fg} />
                </Pressable>
              </View>
              <View style={styles.routeRow}>
                <Text style={styles.route} numberOfLines={1}>
                  {item.start_location}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={colors.textFaint} style={styles.routeArrow} />
                <Text style={styles.route} numberOfLines={1}>
                  {item.end_location}
                </Text>
              </View>
              <Text style={styles.purpose} numberOfLines={1}>
                {item.business_purpose}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.milesRow}>
                  <Ionicons name="speedometer-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.miles}>{formatMiles(item.miles)}</Text>
                </View>
                <Text style={styles.deduction}>{formatCurrency(deduction)}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/trip/new')}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {reassignTarget ? (
        <VenturePickerModal
          visible={!!reassignTarget}
          ventures={ventures}
          currentVentureId={reassignTarget.venture_id}
          onSelect={(ventureId) => reassignVenture(reassignTarget.id, ventureId)}
          onClose={() => setReassignTarget(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 4,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadowSm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  date: {
    ...type.caption,
  },
  ventureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ventureBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  routeArrow: {
    marginHorizontal: 6,
  },
  route: {
    ...type.headline,
    fontSize: 16,
    flexShrink: 1,
  },
  purpose: {
    ...type.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  milesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miles: {
    fontSize: 13.5,
    color: colors.textMuted,
    fontWeight: '600',
  },
  deduction: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
});
