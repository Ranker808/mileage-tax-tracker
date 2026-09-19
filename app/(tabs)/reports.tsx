import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTrips } from '../../src/hooks/useTrips';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { computeVentureRollups, sumRollups } from '../../src/lib/reportCalculations';
import { formatCurrency, formatMiles } from '../../src/lib/format';
import { tripsToCsv, expensesToCsv } from '../../src/lib/csv';
import { shareCsv, sharePdfFromHtml } from '../../src/lib/exportFiles';
import { buildPnlReportHtml } from '../../src/lib/pdfReport';
import { colors } from '../../src/lib/theme';

type RangePreset = 'ytd' | 'lastYear' | 'all';

function rangeForPreset(preset: RangePreset): { start: string | null; end: string | null; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  if (preset === 'ytd') {
    return { start: `${year}-01-01`, end: `${year}-12-31`, label: `${year} (Year to Date)` };
  }
  if (preset === 'lastYear') {
    return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31`, label: `${year - 1}` };
  }
  return { start: null, end: null, label: 'All Time' };
}

export default function ReportsScreen() {
  const { ventures } = useVentures(true);
  const [ventureFilter, setVentureFilter] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>('ytd');
  const { start, end, label } = rangeForPreset(preset);

  const { trips, loading: tripsLoading } = useTrips({ ventureId: ventureFilter, startDate: start, endDate: end });
  const { expenses, loading: expensesLoading } = useExpenses({ ventureId: ventureFilter, startDate: start, endDate: end });

  const rollups = useMemo(() => computeVentureRollups(ventures, trips, expenses), [ventures, trips, expenses]);
  const visibleRollups = ventureFilter ? rollups.filter((r) => r.ventureId === ventureFilter) : rollups;
  const totals = useMemo(() => sumRollups(visibleRollups), [visibleRollups]);

  const ventureById = useMemo(() => new Map(ventures.map((v) => [v.id, v])), [ventures]);

  const handleExportCsv = async () => {
    const tripsCsv = tripsToCsv(trips, ventureById);
    const expensesCsv = expensesToCsv(expenses, ventureById);
    const scope = ventureFilter ? ventureById.get(ventureFilter)?.name ?? 'venture' : 'all-ventures';
    await shareCsv(`trips-${scope}-${preset}.csv`, tripsCsv);
    await shareCsv(`expenses-${scope}-${preset}.csv`, expensesCsv);
  };

  const handleExportPdf = async () => {
    const scope = ventureFilter ? ventureById.get(ventureFilter)?.name ?? 'Venture' : 'All Ventures';
    const html = buildPnlReportHtml({
      title: `P&L Report — ${scope}`,
      rangeLabel: label,
      rollups: visibleRollups,
      totals,
    });
    await sharePdfFromHtml(html, `pnl-report-${preset}.pdf`);
  };

  const loading = tripsLoading || expensesLoading;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Venture</Text>
      <VentureChipRow
        ventures={ventures}
        selectedId={ventureFilter}
        onSelect={setVentureFilter}
        includeAllOption
        onSelectAll={() => setVentureFilter(null)}
      />

      <Text style={styles.sectionLabel}>Date Range</Text>
      <View style={styles.presetRow}>
        {(['ytd', 'lastYear', 'all'] as RangePreset[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.presetChip, preset === p && styles.presetChipSelected]}
            onPress={() => setPreset(p)}
          >
            <Text style={[styles.presetChipText, preset === p && styles.presetChipTextSelected]}>
              {p === 'ytd' ? 'This Year' : p === 'lastYear' ? 'Last Year' : 'All Time'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.totalsCard}>
        <Text style={styles.totalsRangeLabel}>{label}</Text>
        <View style={styles.totalsGrid}>
          <View style={styles.totalsItem}>
            <Text style={styles.totalsValue}>{formatMiles(totals.totalMiles)}</Text>
            <Text style={styles.totalsCaption}>Total Miles</Text>
          </View>
          <View style={styles.totalsItem}>
            <Text style={styles.totalsValue}>{formatCurrency(totals.totalDeduction)}</Text>
            <Text style={styles.totalsCaption}>Mileage Deduction</Text>
          </View>
          <View style={styles.totalsItem}>
            <Text style={styles.totalsValue}>{formatCurrency(totals.totalExpenses)}</Text>
            <Text style={styles.totalsCaption}>Expenses</Text>
          </View>
          <View style={styles.totalsItem}>
            <Text style={[styles.totalsValue, styles.netValue]}>{formatCurrency(totals.netDeductible)}</Text>
            <Text style={styles.totalsCaption}>Net Deductible</Text>
          </View>
        </View>
      </View>

      {!ventureFilter ? (
        <>
          <Text style={styles.sectionLabel}>By Venture</Text>
          {visibleRollups.length === 0 ? (
            <Text style={styles.hint}>No trips or expenses logged in this range yet.</Text>
          ) : (
            visibleRollups.map((r) => (
              <View key={r.ventureId} style={styles.ventureRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ventureRowName}>{r.ventureName}</Text>
                  <Text style={styles.ventureRowSub}>
                    {formatMiles(r.totalMiles)} · {r.tripCount} trips · {r.expenseCount} expenses
                  </Text>
                </View>
                <Text style={styles.ventureRowNet}>{formatCurrency(r.netDeductible)}</Text>
              </View>
            ))
          )}
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Export</Text>
      <Text style={styles.hint}>Full export, no limits, no paywall — it's your data.</Text>
      <View style={styles.exportRow}>
        <Pressable style={styles.exportButton} onPress={handleExportCsv} disabled={loading}>
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </Pressable>
        <Pressable style={styles.exportButton} onPress={handleExportPdf} disabled={loading}>
          <Text style={styles.exportButtonText}>Export PDF</Text>
        </Pressable>
      </View>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    color: colors.text,
    fontWeight: '500',
  },
  presetChipTextSelected: {
    color: '#fff',
  },
  totalsCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 20,
  },
  totalsRangeLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
    fontWeight: '600',
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  totalsItem: {
    width: '50%',
    marginBottom: 16,
  },
  totalsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  netValue: {
    color: colors.success,
  },
  totalsCaption: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  ventureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  ventureRowName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  ventureRowSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  ventureRowNet: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.success,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
