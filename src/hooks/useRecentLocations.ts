import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/demoMode';
import { demoStore } from '../lib/demoStore';
import { topLocations } from '../lib/recentLocations';

const MAX_SUGGESTIONS = 6;
const MAX_TRIPS_SAMPLED = 50;

/** Most-frequently-used start/end locations from past trips, for quick-fill
 * suggestion chips on the trip form — no favorites table, just derived from
 * history. */
export function useRecentLocations() {
  const [locations, setLocations] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      const trips = demoStore.listTrips({});
      setLocations(topLocations(trips.flatMap((t) => [t.start_location, t.end_location]), MAX_SUGGESTIONS));
      return;
    }
    const { data } = await supabase
      .from('trips')
      .select('start_location, end_location')
      .order('date', { ascending: false })
      .limit(MAX_TRIPS_SAMPLED);
    const rows = data ?? [];
    setLocations(topLocations(rows.flatMap((t) => [t.start_location, t.end_location]), MAX_SUGGESTIONS));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { locations };
}
