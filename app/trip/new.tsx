import { useRouter } from 'expo-router';
import { TripForm } from '../../src/components/TripForm';
import { useTrips } from '../../src/hooks/useTrips';

export default function NewTrip() {
  const router = useRouter();
  const { addTrip } = useTrips();

  return (
    <TripForm
      submitLabel="Save Trip"
      onSubmit={async (values) => {
        const result = await addTrip(values);
        if (!result.error) router.back();
        return result;
      }}
    />
  );
}
