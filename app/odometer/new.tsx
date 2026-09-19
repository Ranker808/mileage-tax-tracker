import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useOdometerReadings } from '../../src/hooks/useOdometerReadings';
import { todayIso } from '../../src/lib/format';
import { colors } from '../../src/lib/theme';

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
        keyboardType="decimal-pad"
        autoFocus
      />

      <Text style={styles.hint}>
        Logging a Jan 1 and Dec 31 reading each year is required to substantiate your total annual
        mileage for the IRS.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Save Reading'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 12,
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
    marginTop: 16,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
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
