import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useIncome } from '../../src/hooks/useIncome';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate } from '../../src/lib/format';
import { EXPENSE_CATEGORY_META } from '../../src/lib/expenseCategories';
import { colors, radius, shadow, shadowSm, spacing, type, ventureAccent } from '../../src/lib/theme';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Mode = 'expenses' | 'income';

export default function ExpensesScreen() {
  const router = useRouter();
  const { ventures } = useVentures();
  const [mode, setMode] = useState<Mode>('expenses');
  const [ventureFilter, setVentureFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const dateRangeFilter = {
    ventureId: ventureFilter,
    startDate: DATE_RE.test(dateFrom) ? dateFrom : null,
    endDate: DATE_RE.test(dateTo) ? dateTo : null,
  };
  // Both hooks are called unconditionally (rules of hooks) regardless of
  // which mode is active -- only one of the two result sets is rendered.
  const { expenses, loading: expensesLoading, refresh: refreshExpenses } = useExpenses(dateRangeFilter);
  const { income, loading: incomeLoading, refresh: refreshIncome } = useIncome(dateRangeFilter);

  const loading = mode === 'expenses' ? expensesLoading : incomeLoading;
  const refresh = mode === 'expenses' ? refreshExpenses : refreshIncome;

  const ventureById = useMemo(() => new Map(ventures.map((v) => [v.id, v])), [ventures]);

  const visibleExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((e) => {
      const venture = ventureById.get(e.venture_id);
      return (
        e.category.toLowerCase().includes(q) ||
        (e.notes ?? '').toLowerCase().includes(q) ||
        (venture?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [expenses, search, ventureById]);

  const visibleIncome = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return income;
    return income.filter((i) => {
      const venture = ventureById.get(i.venture_id);
      return (
        i.source.toLowerCase().includes(q) ||
        (i.notes ?? '').toLowerCase().includes(q) ||
        (venture?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [income, search, ventureById]);

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeChip, mode === 'expenses' && styles.modeChipSelected]}
            onPress={() => setMode('expenses')}
          >
            <Text style={[styles.modeChipText, mode === 'expenses' && styles.modeChipTextSelected]}>Expenses</Text>
          </Pressable>
          <Pressable
            style={[styles.modeChip, mode === 'income' && styles.modeChipSelected]}
            onPress={() => setMode('income')}
          >
            <Text style={[styles.modeChipText, mode === 'income' && styles.modeChipTextSelected]}>Income</Text>
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textFaint} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={mode === 'expenses' ? 'Search category, notes, venture…' : 'Search source, notes, venture…'}
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
        <VentureChipRow
          ventures={ventures}
          selectedId={ventureFilter}
          onSelect={setVentureFilter}
          includeAllOption
          onSelectAll={() => setVentureFilter(null)}
        />
      </View>

      {mode === 'expenses' ? (
        <FlatList
          data={visibleExpenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={visibleExpenses.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title={expenses.length === 0 ? 'No expenses yet' : 'No matches'}
              message={
                expenses.length === 0
                  ? 'Log gas, maintenance, or supply costs against a venture.'
                  : 'Try a different search or clear your filters.'
              }
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
                    <Ionicons name={EXPENSE_CATEGORY_META[item.category].icon} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.cardMain}>
                    <Text style={styles.category}>{EXPENSE_CATEGORY_META[item.category].label}</Text>
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
      ) : (
        <FlatList
          data={visibleIncome}
          keyExtractor={(item) => item.id}
          contentContainerStyle={visibleIncome.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="cash-outline"
              title={income.length === 0 ? 'No income logged yet' : 'No matches'}
              message={
                income.length === 0
                  ? 'Log a payout or invoice against a venture to see real profit in Reports.'
                  : 'Try a different search or clear your filters.'
              }
            />
          }
          renderItem={({ item }) => {
            const venture = ventureById.get(item.venture_id);
            const accent = ventureAccent(venture?.name ?? '');
            return (
              <Pressable style={styles.card} onPress={() => router.push(`/income/${item.id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                  <View style={[styles.ventureBadge, { backgroundColor: accent.bg }]}>
                    <Text style={[styles.ventureBadgeText, { color: accent.fg }]}>
                      {venture?.name ?? 'Unknown'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <View style={[styles.categoryIconWrap, styles.incomeIconWrap]}>
                    <Ionicons name="cash-outline" size={18} color={colors.success} />
                  </View>
                  <View style={styles.cardMain}>
                    <Text style={styles.category} numberOfLines={1}>
                      {item.source}
                    </Text>
                    {item.notes ? (
                      <Text style={styles.notes} numberOfLines={1}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={[styles.amount, styles.incomeAmount]}>{formatCurrency(item.amount)}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push(mode === 'expenses' ? '/expense/new' : '/income/new')}
      >
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
    gap: spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  modeChipSelected: {
    backgroundColor: colors.card,
    ...shadowSm,
  },
  modeChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modeChipTextSelected: {
    color: colors.ink,
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
  incomeIconWrap: {
    backgroundColor: colors.successMuted,
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
  incomeAmount: {
    color: colors.success,
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
