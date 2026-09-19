import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVentures } from '../hooks/useVentures';
import { VentureChipRow } from './VentureChipRow';
import { calculateDeduction, getMileageRatePeriod } from '../lib/mileageRates';
import { formatCurrency, todayIso } from '../lib/format';
import { colors } from '../lib/theme';
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
            <Text style={styles.ratePreviewLabel}>
              Rate: {ratePeriod.label} · {(ratePeriod.ratePerMile * 100).toFixed(1)}¢/mi
            </Text>
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
    padding: 20,
    paddingBottom: 48,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.card,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  ratePreview: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.primaryMuted,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratePreviewLabel: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  deductionPreview: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
