import { useLocalSearchParams, useRouter } from 'expo-router';
import { TripForm } from '../../src/components/TripForm';
import { useTrips } from '../../src/hooks/useTrips';
import { removePendingTrip } from '../../src/lib/pendingTrips';

export default function NewTrip() {
  const router = useRouter();
  const { addTrip } = useTrips();
  const { prefillStart, prefillEnd, prefillMiles, pendingId } = useLocalSearchParams<{
    prefillStart?: string;
    prefillEnd?: string;
    prefillMiles?: string;
    pendingId?: string;
  }>();

  return (
    <TripForm
      initial={{
        start_location: prefillStart,
        end_location: prefillEnd,
        miles: prefillMiles,
      }}
      submitLabel="Save Trip"
      onSubmit={async (values) => {
        const result = await addTrip(values);
        if (!result.error) {
          // Only clear the detected trip out of the review queue once it's
          // actually been saved — backing out of this form should leave
          // it there to review again later, not silently discard it.
          if (pendingId) await removePendingTrip(pendingId);
          router.back();
        }
        return result;
      }}
    />
  );
}
