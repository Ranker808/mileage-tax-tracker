import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVentures } from '../hooks/useVentures';
import { VentureChipRow } from './VentureChipRow';
import { calculateDeduction, getMileageRatePeriod } from '../lib/mileageRates';
import { formatCurrency, todayIso } from '../lib/format';
import { colors, radius, spacing, type } from '../lib/theme';
import type { TripInput } from '../hooks/useTrips';

export interface TripFormValues {
  date: string;
  venture_id: string;
  start_location: string;
  end_location: string;
  business_purpose: string;
  miles: string;
}

interface Props {
  initial?: Partial<TripFormValues>;
  submitLabel: string;
  onSubmit: (values: TripInput) => Promise<{ error: string | null }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function TripForm({ initial, submitLabel, onSubmit }: Props) {
  const { ventures } = useVentures();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [ventureId, setVentureId] = useState(initial?.venture_id ?? '');
  const [startLocation, setStartLocation] = useState(initial?.start_location ?? '');
  const [endLocation, setEndLocation] = useState(initial?.end_location ?? '');
  const [purpose, setPurpose] = useState(initial?.business_purpose ?? '');
  const [miles, setMiles] = useState(initial?.miles ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveVentureId = ventureId || ventures[0]?.id || '';

  const milesNum = parseFloat(miles);
  const ratePeriod = DATE_RE.test(date) ? getMileageRatePeriod(date) : undefined;
  const deductionPreview = useMemo(() => {
    if (!DATE_RE.test(date) || !Number.isFinite(milesNum) || milesNum <= 0) return null;
    try {
      return calculateDeduction(milesNum, date);
    } catch {
      return null;
    }
  }, [date, milesNum]);

  const handleSubmit = async () => {
    setError(null);
    if (!DATE_RE.test(date)) {
      setError('Date must be in YYYY-MM-DD format.');
      return;
    }
    if (!effectiveVentureId) {
      setError('Add a venture before logging trips.');
      return;
    }
    if (!startLocation.trim() || !endLocation.trim()) {
      setError('Start and end location are required.');
      return;
    }
    if (!purpose.trim()) {
      setError('Business purpose is required — the IRS requires it.');
      return;
    }
    if (!Number.isFinite(milesNum) || milesNum <= 0) {
      setError('Enter a valid mileage greater than 0.');
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      date,
      venture_id: effectiveVentureId,
      start_location: startLocation.trim(),
      end_location: endLocation.trim(),
      business_purpose: purpose.trim(),
      miles: Math.round(milesNum * 100) / 100,
    });
    setSubmitting(false);
    if (submitError) setError(submitError);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Venture</Text>
      {ventures.length === 0 ? (
        <Text style={styles.hint}>No ventures yet — add one from the Ventures tab first.</Text>
      ) : (
        <VentureChipRow
          ventures={ventures}
          selectedId={effectiveVentureId}
          onSelect={setVentureId}
        />
      )}

      <Text style={styles.label}>Start location</Text>
      <TextInput
        style={styles.input}
        value={startLocation}
        onChangeText={setStartLocation}
        placeholder="Home office"
      />

      <Text style={styles.label}>Destination</Text>
      <TextInput
        style={styles.input}
        value={endLocation}
        onChangeText={setEndLocation}
        placeholder="Client site"
      />

      <Text style={styles.label}>Business purpose</Text>
      <TextInput
        style={styles.input}
        value={purpose}
        onChangeText={setPurpose}
        placeholder="Delivery run, client meeting, supply pickup..."
      />

      <Text style={styles.label}>Miles</Text>
      <TextInput
        style={styles.input}
        value={String(miles)}
        onChangeText={setMiles}
        placeholder="0.0"
        keyboardType="decimal-pad"
      />

      <View style={styles.ratePreview}>
        {ratePeriod ? (
          <>
            <View style={styles.ratePreviewLeft}>
              <Ionicons name="trending-up-outline" size={16} color={colors.primary} />
              <Text style={styles.ratePreviewLabel}>
                {ratePeriod.label} · {(ratePeriod.ratePerMile * 100).toFixed(1)}¢/mi
              </Text>
            </View>
            {deductionPreview !== null ? (
              <Text style={styles.deductionPreview}>{formatCurrency(deductionPreview)}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.hint}>
            No mileage rate configured for this date yet. Add one to src/lib/mileageRates.ts.
          </Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: 48,
  },
  label: {
    ...type.eyebrow,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  hint: {
    ...type.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  ratePreview: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratePreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratePreviewLabel: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  deductionPreview: {
    fontSize: 17,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.lg,
  },
  error: {
    flex: 1,
    color: colors.danger,
    fontSize: 13.5,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
