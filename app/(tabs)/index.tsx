import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTrips } from '../../src/hooks/useTrips';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { VenturePickerModal } from '../../src/components/VenturePickerModal';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate, formatMiles } from '../../src/lib/format';
import { calculateDeduction } from '../../src/lib/mileageRates';
import { colors } from '../../src/lib/theme';
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState
            title="No trips yet"
            message="Log your first business trip to start tracking your mileage deduction."
          />
        }
        renderItem={({ item }) => {
          const venture = ventureById.get(item.venture_id);
          const deduction = calculateDeduction(item.miles, item.date);
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/trip/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Pressable
                  style={styles.ventureBadge}
                  onPress={(e) => {
                    e.stopPropagation();
                    setReassignTarget(item);
                  }}
                >
                  <Text style={styles.ventureBadgeText}>{venture?.name ?? 'Unknown'} ›</Text>
                </Pressable>
              </View>
              <Text style={styles.route} numberOfLines={1}>
                {item.start_location} → {item.end_location}
              </Text>
              <Text style={styles.purpose} numberOfLines={1}>
                {item.business_purpose}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.miles}>{formatMiles(item.miles)}</Text>
                <Text style={styles.deduction}>{formatCurrency(deduction)}</Text>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/trip/new')}>
        <Text style={styles.fabText}>+</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  ventureBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ventureBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  route: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  purpose: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miles: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  deduction: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '400',
  },
});
