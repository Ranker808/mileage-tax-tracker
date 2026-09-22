import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVentures } from '../hooks/useVentures';
import { VentureChipRow } from './VentureChipRow';
import { todayIso } from '../lib/format';
import { colors, radius, spacing, type } from '../lib/theme';
import type { IncomeInput } from '../hooks/useIncome';

export interface IncomeFormValues {
  date: string;
  venture_id: string;
  amount: string;
  source: string;
  notes: string;
}

interface Props {
  initial?: Partial<IncomeFormValues>;
  submitLabel: string;
  onSubmit: (values: IncomeInput) => Promise<{ error: string | null }>;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function IncomeForm({ initial, submitLabel, onSubmit }: Props) {
  const { ventures } = useVentures();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [ventureId, setVentureId] = useState(initial?.venture_id ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveVentureId = ventureId || ventures[0]?.id || '';

  const handleSubmit = async () => {
    setError(null);
    if (!DATE_RE.test(date)) {
      setError('Date must be in YYYY-MM-DD format.');
      return;
    }
    if (!effectiveVentureId) {
      setError('Add a venture before logging income.');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (!source.trim()) {
      setError('Enter a source — who paid you, or what platform.');
      return;
    }

    setSubmitting(true);
    const { error: submitError } = await onSubmit({
      date,
      venture_id: effectiveVentureId,
      amount: Math.round(amountNum * 100) / 100,
      source: source.trim(),
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (submitError) setError(submitError);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />

      <Text style={styles.label}>Venture</Text>
      {ventures.length === 0 ? (
        <Text style={styles.hint}>No ventures yet — add one from the Ventures tab first.</Text>
      ) : (
        <VentureChipRow ventures={ventures} selectedId={effectiveVentureId} onSelect={setVentureId} />
      )}

      <Text style={styles.label}>Amount</Text>
      <TextInput style={styles.input} value={String(amount)} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

      <Text style={styles.label}>Source</Text>
      <TextInput
        style={styles.input}
        value={source}
        onChangeText={setSource}
        placeholder="DoorDash payout, client invoice..."
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Invoice #, extra context..." />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
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
