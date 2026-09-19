import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Trip } from '../types/database';

export interface TripFilter {
  ventureId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export type TripInput = Omit<Trip, 'id' | 'user_id' | 'created_at'>;

export function useTrips(filter: TripFilter = {}) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('trips').select('*').order('date', { ascending: false });
    if (filter.ventureId) query = query.eq('venture_id', filter.ventureId);
    if (filter.startDate) query = query.gte('date', filter.startDate);
    if (filter.endDate) query = query.lte('date', filter.endDate);
    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setTrips(data ?? []);
    }
    setLoading(false);
  }, [filter.ventureId, filter.startDate, filter.endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTrip = useCallback(
    async (input: TripInput) => {
      const { error: insertError } = await supabase.from('trips').insert(input);
      if (insertError) return { error: insertError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const updateTrip = useCallback(
    async (id: string, updates: Partial<TripInput>) => {
      const { error: updateError } = await supabase.from('trips').update(updates).eq('id', id);
      if (updateError) return { error: updateError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const reassignVenture = useCallback(
    (id: string, ventureId: string) => updateTrip(id, { venture_id: ventureId }),
    [updateTrip]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('trips').delete().eq('id', id);
      if (deleteError) return { error: deleteError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { trips, loading, error, refresh, addTrip, updateTrip, reassignVenture, deleteTrip };
}

export async function fetchTrip(id: string): Promise<Trip | null> {
  const { data, error } = await supabase.from('trips').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
