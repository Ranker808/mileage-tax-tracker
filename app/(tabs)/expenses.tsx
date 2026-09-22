import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { colors, radius, shadow, shadowSm, spacing, type, ventureAccent } from '../../src/lib/theme';
import type { ExpenseCategory } from '../../src/types/database';

const CATEGORY_ICON: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  gas: 'flame-outline',
  maintenance: 'construct-outline',
  supplies: 'cube-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

export default function ExpensesScreen() {
  const router = useRouter();
  const { ventures } = useVentures();
  const [ventureFilter, setVentureFilter] = useState<string | null>(null);
  const { expenses, loading, refresh } = useExpenses({ ventureId: ventureFilter });

  const ventureById = useMemo(() => new Map(ventures.map((v) => [v.id, v])), [ventures]);

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
        data={expenses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={expenses.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No expenses yet"
            message="Log gas, maintenance, or supply costs against a venture."
          />
        }
        renderItem={({ item }) => {
          const venture = ventureById.get(item.venture_id);
          const accent = ventureAccent(venture?.name ?? '');
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/expense/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <View style={[styles.ventureBadge, { backgroundColor: accent.bg }]}>
                  <Text style={[styles.ventureBadgeText, { color: accent.fg }]}>
                    {venture?.name ?? 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.categoryIconWrap}>
                  <Ionicons name={CATEGORY_ICON[item.category]} size={18} color={colors.primary} />
                </View>
                <View style={styles.cardMain}>
                  <Text style={styles.category}>{item.category[0].toUpperCase() + item.category.slice(1)}</Text>
                  {item.notes ? (
                    <Text style={styles.notes} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                  {item.receipt_photo_url ? (
                    <View style={styles.receiptTag}>
                      <Ionicons name="attach" size={11} color={colors.textMuted} />
                      <Text style={styles.receiptTagText}>receipt</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/expense/new')}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
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
  },
  listContent: {
    padding: spacing.lg,
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
    marginBottom: spacing.md,
  },
  date: {
    ...type.caption,
  },
  ventureBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ventureBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    ...type.headline,
    fontSize: 15.5,
  },
  notes: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  receiptTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 3,
  },
  receiptTagText: {
    fontSize: 11,
    color: colors.textMuted,
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
