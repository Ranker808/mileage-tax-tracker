import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IncomeForm } from '../../src/components/IncomeForm';
import { fetchIncome, useIncome } from '../../src/hooks/useIncome';
import { colors, spacing } from '../../src/lib/theme';
import { confirmAsync } from '../../src/lib/confirm';
import type { Income } from '../../src/types/database';

export default function IncomeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { updateIncome, deleteIncome } = useIncome();
  const [income, setIncome] = useState<Income | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchIncome(id).then(setIncome);
  }, [id]);

  if (income === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (income === null) {
    return (
      <View style={styles.center}>
        <Text>Income not found.</Text>
      </View>
    );
  }

  const handleDelete = async () => {
    const confirmed = await confirmAsync('Delete income?', 'This cannot be undone.', 'Delete');
    if (!confirmed) return;
    const { error } = await deleteIncome(income.id);
    if (!error) router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <IncomeForm
        initial={{
          date: income.date,
          venture_id: income.venture_id,
          amount: String(income.amount),
          source: income.source,
          notes: income.notes ?? '',
        }}
        submitLabel="Save Changes"
        onSubmit={async (values) => {
          const result = await updateIncome(income.id, values);
          if (!result.error) router.back();
          return result;
        }}
      />
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={16} color={colors.danger} />
        <Text style={styles.deleteText}>Delete Income</Text>
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginBottom: 32,
    paddingVertical: 14,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
