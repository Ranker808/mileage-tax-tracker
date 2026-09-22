import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrips } from '../../src/hooks/useTrips';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { VenturePickerModal } from '../../src/components/VenturePickerModal';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate, formatMiles } from '../../src/lib/format';
import { calculateDeduction } from '../../src/lib/mileageRates';
import { confirmAsync } from '../../src/lib/confirm';
import { colors, radius, shadow, shadowSm, spacing, type, ventureAccent } from '../../src/lib/theme';
import type { Trip } from '../../src/types/database';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function TripsScreen() {
  const router = useRouter();
  const { ventures } = useVentures();
  const [ventureFilter, setVentureFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { trips, loading, refresh, reassignVenture, bulkDeleteTrips, bulkReassignVenture } = useTrips({
    ventureId: ventureFilter,
    startDate: DATE_RE.test(dateFrom) ? dateFrom : null,
    endDate: DATE_RE.test(dateTo) ? dateTo : null,
  });
  const [reassignTarget, setReassignTarget] = useState<Trip | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);

  const ventureById = useMemo(() => {
    const map = new Map(ventures.map((v) => [v.id, v]));
    return map;
  }, [ventures]);

  const visibleTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) => {
      const venture = ventureById.get(t.venture_id);
      return (
        t.start_location.toLowerCase().includes(q) ||
        t.end_location.toLowerCase().includes(q) ||
        t.business_purpose.toLowerCase().includes(q) ||
        (venture?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [trips, search, ventureById]);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    const confirmed = await confirmAsync(
      `Delete ${count} ${count === 1 ? 'trip' : 'trips'}?`,
      'This cannot be undone.',
      'Delete'
    );
    if (!confirmed) return;
    await bulkDeleteTrips(Array.from(selectedIds));
    exitSelectMode();
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textFaint} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search location, purpose, venture…"
            placeholderTextColor={colors.textFaint}
          />
        </View>
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            value={dateFrom}
            onChangeText={setDateFrom}
            placeholder="From YYYY-MM-DD"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.dateInput}
            value={dateTo}
            onChangeText={setDateTo}
            placeholder="To YYYY-MM-DD"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
          />
          {dateFrom || dateTo ? (
            <Pressable
              style={styles.clearDateButton}
              onPress={() => {
                setDateFrom('');
                setDateTo('');
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.ventureFilterRow}>
          <View style={{ flex: 1 }}>
            <VentureChipRow
              ventures={ventures}
              selectedId={ventureFilter}
              onSelect={setVentureFilter}
              includeAllOption
              onSelectAll={() => setVentureFilter(null)}
            />
          </View>
          <Pressable
            style={[styles.selectToggle, selectMode && styles.selectToggleActive]}
            onPress={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          >
            <Text style={[styles.selectToggleText, selectMode && styles.selectToggleTextActive]}>
              {selectMode ? 'Cancel' : 'Select'}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={visibleTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={visibleTrips.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title={trips.length === 0 ? 'No trips yet' : 'No matches'}
            message={
              trips.length === 0
                ? 'Log your first business trip to start tracking your mileage deduction.'
                : 'Try a different search or clear your filters.'
            }
          />
        }
        renderItem={({ item }) => {
          const venture = ventureById.get(item.venture_id);
          const accent = ventureAccent(venture?.name ?? '');
          const deduction = calculateDeduction(item.miles, item.date);
          const isSelected = selectedIds.has(item.id);
          return (
            <Pressable
              style={[styles.card, selectMode && isSelected && styles.cardSelected]}
              onPress={() => (selectMode ? toggleSelected(item.id) : router.push(`/trip/${item.id}`))}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {selectMode ? (
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? colors.primary : colors.textFaint}
                      style={styles.selectIcon}
                    />
                  ) : null}
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                </View>
                <Pressable
                  style={[styles.ventureBadge, { backgroundColor: accent.bg }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (!selectMode) setReassignTarget(item);
                  }}
                  hitSlop={6}
                >
                  <Text style={[styles.ventureBadgeText, { color: accent.fg }]}>
                    {venture?.name ?? 'Unknown'}
                  </Text>
                  {selectMode ? null : <Ionicons name="chevron-down" size={12} color={accent.fg} />}
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

      {selectMode ? (
        selectedIds.size > 0 ? (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkBarCount}>{selectedIds.size} selected</Text>
            <View style={styles.bulkBarActions}>
              <Pressable style={styles.bulkBarButton} onPress={() => setBulkReassignOpen(true)}>
                <Ionicons name="swap-horizontal" size={16} color={colors.ink} />
                <Text style={styles.bulkBarButtonText}>Reassign</Text>
              </Pressable>
              <Pressable style={[styles.bulkBarButton, styles.bulkBarButtonDanger]} onPress={handleBulkDelete}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={[styles.bulkBarButtonText, styles.bulkBarButtonTextDanger]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ) : null
      ) : (
        <>
          <Pressable style={styles.trackFab} onPress={() => router.push('/trip/track')}>
            <Ionicons name="navigate" size={22} color={colors.primary} />
          </Pressable>

          <Pressable style={styles.fab} onPress={() => router.push('/trip/new')}>
            <Ionicons name="add" size={28} color={colors.white} />
          </Pressable>
        </>
      )}

      {reassignTarget ? (
        <VenturePickerModal
          visible={!!reassignTarget}
          ventures={ventures}
          currentVentureId={reassignTarget.venture_id}
          onSelect={(ventureId) => reassignVenture(reassignTarget.id, ventureId)}
          onClose={() => setReassignTarget(null)}
        />
      ) : null}

      {bulkReassignOpen ? (
        <VenturePickerModal
          visible={bulkReassignOpen}
          ventures={ventures}
          currentVentureId=""
          onSelect={async (ventureId) => {
            await bulkReassignVenture(Array.from(selectedIds), ventureId);
            setBulkReassignOpen(false);
            exitSelectMode();
          }}
          onClose={() => setBulkReassignOpen(false)}
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
    gap: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14.5,
    color: colors.ink,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 12.5,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  clearDateButton: {
    padding: 2,
  },
  ventureFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectToggle: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectToggleActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  selectToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  selectToggleTextActive: {
    color: colors.white,
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
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectIcon: {
    marginRight: 2,
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
  bulkBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  bulkBarCount: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  bulkBarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulkBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  bulkBarButtonDanger: {
    backgroundColor: colors.dangerMuted,
  },
  bulkBarButtonText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  bulkBarButtonTextDanger: {
    color: colors.danger,
  },
  trackFab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl + 58 + spacing.md,
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowSm,
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
