import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVentures, fetchAllVentures } from '../../src/hooks/useVentures';
import { colors } from '../../src/lib/theme';
import type { Venture } from '../../src/types/database';

export default function VentureDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { updateVenture, archiveVenture, unarchiveVenture } = useVentures(true);
  const [venture, setVenture] = useState<Venture | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAllVentures().then((all) => {
      const found = all.find((v) => v.id === id) ?? null;
      setVenture(found);
      setName(found?.name ?? '');
    });
  }, [id]);

  if (venture === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (venture === null) {
    return (
      <View style={styles.center}>
        <Text>Venture not found.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setSubmitting(true);
    const { error: submitError } = await updateVenture(venture.id, { name: name.trim() });
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
    } else {
      router.back();
    }
  };

  const handleToggleArchive = async () => {
    if (venture.active) {
      await archiveVenture(venture.id);
    } else {
      await unarchiveVenture(venture.id);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Venture name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSave} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Save Changes'}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleToggleArchive}>
        <Text style={styles.secondaryButtonText}>
          {venture.active ? 'Archive Venture' : 'Unarchive Venture'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
