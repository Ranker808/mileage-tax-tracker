import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVentures, fetchAllVentures } from '../../src/hooks/useVentures';
import { colors, radius, spacing, type } from '../../src/lib/theme';
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
        <ActivityIndicator color={colors.primary} />
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

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSave} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Save Changes'}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleToggleArchive}>
        <Ionicons
          name={venture.active ? 'archive-outline' : 'refresh-outline'}
          size={16}
          color={colors.textMuted}
        />
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
    padding: spacing.xl,
  },
  label: {
    ...type.eyebrow,
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
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
});
