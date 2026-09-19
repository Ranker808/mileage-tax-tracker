import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { colors } from '../../src/lib/theme';

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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={
          <EmptyState title="No expenses yet" message="Log gas, maintenance, or supply costs against a venture." />
        }
        renderItem={({ item }) => {
          const venture = ventureById.get(item.venture_id);
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/expense/${item.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <View style={styles.ventureBadge}>
                  <Text style={styles.ventureBadgeText}>{venture?.name ?? 'Unknown'}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.categoryRow}>
                  <Text style={styles.category}>{item.category[0].toUpperCase() + item.category.slice(1)}</Text>
                  {item.receipt_photo_url ? <Text style={styles.receiptTag}>📎 receipt</Text> : null}
                </View>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
              </View>
              {item.notes ? (
                <Text style={styles.notes} numberOfLines={1}>
                  {item.notes}
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/expense/new')}>
        <Text style={styles.fabText}>+</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  listContent: {
    padding: 16,
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
    marginBottom: 8,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  receiptTag: {
    fontSize: 12,
    color: colors.textMuted,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  notes: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
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
