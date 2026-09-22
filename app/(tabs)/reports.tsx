import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTrips } from '../../src/hooks/useTrips';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useVentures } from '../../src/hooks/useVentures';
import { VentureChipRow } from '../../src/components/VentureChipRow';
import { computeVentureRollups, sumRollups } from '../../src/lib/reportCalculations';
import { formatCurrency, formatMiles } from '../../src/lib/format';
import { tripsToCsv, expensesToCsv } from '../../src/lib/csv';
import { shareCsv, sharePdfFromHtml, sanitizeFilenamePart } from '../../src/lib/exportFiles';
import { buildPnlReportHtml } from '../../src/lib/pdfReport';
import { colors, radius, shadow, shadowSm, spacing, type, ventureAccent } from '../../src/lib/theme';

type RangePreset = 'ytd' | 'lastYear' | 'all';

function rangeForPreset(preset: RangePreset): { start: string | null; end: string | null; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  if (preset === 'ytd') {
    return { start: `${year}-01-01`, end: `${year}-12-31`, label: `${year} · Year to date` };
  }
  if (preset === 'lastYear') {
    return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31`, label: `${year - 1}` };
  }
  return { start: null, end: null, label: 'All time' };
}

export default function ReportsScreen() {
  const { ventures } = useVentures(true);
  const [ventureFilter, setVentureFilter] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>('ytd');
  const { start, end, label } = rangeForPreset(preset);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const { trips, loading: tripsLoading } = useTrips({ ventureId: ventureFilter, startDate: start, endDate: end });
  const { expenses, loading: expensesLoading } = useExpenses({ ventureId: ventureFilter, startDate: start, endDate: end });

  const rollups = useMemo(() => computeVentureRollups(ventures, trips, expenses), [ventures, trips, expenses]);
  const visibleRollups = ventureFilter ? rollups.filter((r) => r.ventureId === ventureFilter) : rollups;
  const totals = useMemo(() => sumRollups(visibleRollups), [visibleRollups]);

  const ventureById = useMemo(() => new Map(ventures.map((v) => [v.id, v])), [ventures]);

  const handleExportCsv = async () => {
    setExporting('csv');
    try {
      const tripsCsv = tripsToCsv(trips, ventureById);
      const expensesCsv = expensesToCsv(expenses, ventureById);
      const scope = sanitizeFilenamePart(
        ventureFilter ? ventureById.get(ventureFilter)?.name ?? 'venture' : 'all-ventures'
      );
      await shareCsv(`trips-${scope}-${preset}.csv`, tripsCsv);
      await shareCsv(`expenses-${scope}-${preset}.csv`, expensesCsv);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting('pdf');
    try {
      const scope = ventureFilter ? ventureById.get(ventureFilter)?.name ?? 'Venture' : 'All Ventures';
      const html = buildPnlReportHtml({
        title: `P&L Report — ${scope}`,
        rangeLabel: label,
        rollups: visibleRollups,
        totals,
      });
      await sharePdfFromHtml(html, `pnl-report-${preset}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  const loading = tripsLoading || expensesLoading;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>{label}</Text>
          {loading ? <ActivityIndicator size="small" color={colors.white} /> : null}
        </View>
        <Text style={styles.heroLabel}>Net deductible</Text>
        <Text style={styles.heroNumber}>{formatCurrency(totals.netDeductible)}</Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroGrid}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatMiles(totals.totalMiles)}</Text>
            <Text style={styles.heroStatLabel}>Miles</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatCurrency(totals.totalDeduction)}</Text>
            <Text style={styles.heroStatLabel}>Mileage deduction</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatCurrency(totals.totalExpenses)}</Text>
            <Text style={styles.heroStatLabel}>Expenses</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Venture</Text>
      <VentureChipRow
        ventures={ventures}
        selectedId={ventureFilter}
        onSelect={setVentureFilter}
        includeAllOption
        onSelectAll={() => setVentureFilter(null)}
      />

      <Text style={styles.sectionLabel}>Date range</Text>
      <View style={styles.presetRow}>
        {(['ytd', 'lastYear', 'all'] as RangePreset[]).map((p) => (
          <Pressable
            key={p}
            style={[styles.presetChip, preset === p && styles.presetChipSelected]}
            onPress={() => setPreset(p)}
          >
            <Text style={[styles.presetChipText, preset === p && styles.presetChipTextSelected]}>
              {p === 'ytd' ? 'This year' : p === 'lastYear' ? 'Last year' : 'All time'}
            </Text>
          </Pressable>
        ))}
      </View>

      {!ventureFilter ? (
        <>
          <Text style={styles.sectionLabel}>By venture</Text>
          {visibleRollups.length === 0 ? (
            <Text style={styles.hint}>No trips or expenses logged in this range yet.</Text>
          ) : (
            visibleRollups.map((r) => {
              const accent = ventureAccent(r.ventureName);
              return (
                <View key={r.ventureId} style={styles.ventureRow}>
                  <View style={[styles.ventureAvatar, { backgroundColor: accent.bg }]}>
                    <Text style={[styles.ventureAvatarLetter, { color: accent.fg }]}>
                      {r.ventureName[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ventureRowName}>{r.ventureName}</Text>
                    <Text style={styles.ventureRowSub}>
                      {formatMiles(r.totalMiles)} · {r.tripCount} trips · {r.expenseCount} expenses
                    </Text>
                  </View>
                  <Text style={styles.ventureRowNet}>{formatCurrency(r.netDeductible)}</Text>
                </View>
              );
            })
          )}
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Export</Text>
      <Text style={styles.hint}>Full export, no limits, no paywall — it's your data.</Text>
      <View style={styles.exportRow}>
        <Pressable style={styles.exportButton} onPress={handleExportCsv} disabled={!!exporting}>
          {exporting === 'csv' ? (
            <ActivityIndicator size="small" color={colors.ink} />
          ) : (
            <Ionicons name="document-text-outline" size={17} color={colors.ink} />
          )}
          <Text style={styles.exportButtonText}>CSV</Text>
        </Pressable>
        <Pressable style={styles.exportButton} onPress={handleExportPdf} disabled={!!exporting}>
          {exporting === 'pdf' ? (
            <ActivityIndicator size="small" color={colors.ink} />
          ) : (
            <Ionicons name="document-outline" size={17} color={colors.ink} />
          )}
          <Text style={styles.exportButtonText}>PDF</Text>
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
    padding: spacing.lg,
    paddingBottom: 48,
  },
  heroCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadow,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.md,
    fontWeight: '600',
  },
  heroNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -1,
    marginTop: 2,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: spacing.lg,
  },
  heroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
  },
  heroStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
    fontWeight: '600',
  },
  sectionLabel: {
    ...type.eyebrow,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  presetChipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13.5,
  },
  presetChipTextSelected: {
    color: colors.white,
  },
  hint: {
    ...type.body,
    color: colors.textMuted,
    fontSize: 13.5,
  },
  ventureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadowSm,
  },
  ventureAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ventureAvatarLetter: {
    fontSize: 14,
    fontWeight: '800',
  },
  ventureRowName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.ink,
  },
  ventureRowSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  ventureRowNet: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 13,
  },
  exportButtonText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14.5,
  },
});
