import { useRouter } from 'expo-router';
import { ExpenseForm } from '../../src/components/ExpenseForm';
import { useExpenses } from '../../src/hooks/useExpenses';

export default function NewExpense() {
  const router = useRouter();
  const { addExpense } = useExpenses();

  return (
    <ExpenseForm
      submitLabel="Save Expense"
      onSubmit={async (values) => {
        const result = await addExpense(values);
        if (!result.error) router.back();
        return result;
      }}
    />
  );
}
