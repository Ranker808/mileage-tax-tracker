import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOdometerReadings } from '../../src/hooks/useOdometerReadings';
import { todayIso } from '../../src/lib/format';
import { colors, radius, spacing, type } from '../../src/lib/theme';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function NewOdometerReading() {
  const router = useRouter();
  const { addReading } = useOdometerReadings();
  const [date, setDate] = useState(todayIso());
  const [reading, setReading] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!DATE_RE.test(date)) {
      setError('Date must be in YYYY-MM-DD format.');
      return;
    }
    const readingNum = parseFloat(reading);
    if (!Number.isFinite(readingNum) || readingNum < 0) {
      setError('Enter a valid odometer reading.');
      return;
    }
    setSubmitting(true);
    const { error: submitError } = await addReading(date, readingNum);
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />

      <Text style={styles.label}>Odometer reading (miles)</Text>
      <TextInput
        style={styles.input}
        value={reading}
        onChangeText={setReading}
        placeholder="e.g. 45210.4"
        placeholderTextColor={colors.textFaint}
        keyboardType="decimal-pad"
        autoFocus
      />

      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
        <Text style={styles.hint}>
          Logging a Jan 1 and Dec 31 reading each year is required to substantiate your total annual
          mileage for the IRS.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Save Reading'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  label: {
    ...type.eyebrow,
    marginTop: spacing.md,
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
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  hint: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
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
