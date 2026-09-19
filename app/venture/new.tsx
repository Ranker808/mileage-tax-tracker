import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useVentures } from '../../src/hooks/useVentures';
import { colors } from '../../src/lib/theme';

export default function NewVenture() {
  const router = useRouter();
  const { addVenture } = useVentures();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Give this venture a name.');
      return;
    }
    setSubmitting(true);
    const { error: submitError } = await addVenture(name.trim());
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Venture name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. DoorDash, Notary, IT Support"
        autoFocus
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Add Venture'}</Text>
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
