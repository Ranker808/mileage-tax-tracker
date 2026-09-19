import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/demoMode';
import { demoStore } from '../lib/demoStore';
import type { OdometerReading } from '../types/database';

export { odometerReminder } from '../lib/odometerReminder';

export function useOdometerReadings() {
  const [readings, setReadings] = useState<OdometerReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (isDemoMode()) {
      setError(null);
      setReadings(demoStore.listOdometerReadings());
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase
      .from('odometer_readings')
      .select('*')
      .order('date', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setReadings(data ?? []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const addReading = useCallback(
    async (date: string, reading: number) => {
      if (isDemoMode()) {
        const result = demoStore.addOdometerReading(date, reading);
        await refresh();
        return result;
      }
      const { error: upsertError } = await supabase
        .from('odometer_readings')
        .upsert({ date, reading }, { onConflict: 'user_id,date' });
      if (upsertError) return { error: upsertError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deleteReading = useCallback(
    async (id: string) => {
      if (isDemoMode()) {
        const result = demoStore.deleteOdometerReading(id);
        await refresh();
        return result;
      }
      const { error: deleteError } = await supabase.from('odometer_readings').delete().eq('id', id);
      if (deleteError) return { error: deleteError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { readings, loading, error, refresh, addReading, deleteReading };
}
