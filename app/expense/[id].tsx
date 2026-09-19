import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { fetchExpense, useExpenses } from '../../src/hooks/useExpenses';
import { colors } from '../../src/lib/theme';
import type { Expense } from '../../src/types/database';

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { updateExpense, deleteExpense } = useExpenses();
  const [expense, setExpense] = useState<Expense | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchExpense(id).then(setExpense);
  }, [id]);

  if (expense === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (expense === null) {
    return (
      <View style={styles.center}>
        <Text>Expense not found.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete expense?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteExpense(expense.id);
          if (!error) router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpenseForm
        initial={{
          date: expense.date,
          venture_id: expense.venture_id,
          amount: String(expense.amount),
          category: expense.category,
          notes: expense.notes ?? '',
          receipt_photo_url: expense.receipt_photo_url,
        }}
        submitLabel="Save Changes"
        onSubmit={async (values) => {
          const result = await updateExpense(expense.id, values);
          if (!result.error) router.back();
          return result;
        }}
      />
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Expense</Text>
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
    marginHorizontal: 20,
    marginBottom: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
