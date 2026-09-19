import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { OdometerReading } from '../types/database';

export { odometerReminder } from '../lib/odometerReminder';

export function useOdometerReadings() {
  const [readings, setReadings] = useState<OdometerReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addReading = useCallback(
    async (date: string, reading: number) => {
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
      const { error: deleteError } = await supabase.from('odometer_readings').delete().eq('id', id);
      if (deleteError) return { error: deleteError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { readings, loading, error, refresh, addReading, deleteReading };
}
