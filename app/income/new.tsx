import { useRouter } from 'expo-router';
import { IncomeForm } from '../../src/components/IncomeForm';
import { useIncome } from '../../src/hooks/useIncome';

export default function NewIncome() {
  const router = useRouter();
  const { addIncome } = useIncome();

  return (
    <IncomeForm
      submitLabel="Save Income"
      onSubmit={async (values) => {
        const result = await addIncome(values);
        if (!result.error) router.back();
        return result;
      }}
    />
  );
}
