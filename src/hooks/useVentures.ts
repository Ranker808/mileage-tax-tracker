import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Venture } from '../types/database';

export function useVentures(includeArchived = false) {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('ventures').select('*').order('name', { ascending: true });
    if (!includeArchived) {
      query = query.eq('active', true);
    }
    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setVentures(data ?? []);
    }
    setLoading(false);
  }, [includeArchived]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addVenture = useCallback(
    async (name: string) => {
      const { error: insertError } = await supabase.from('ventures').insert({ name, active: true });
      if (insertError) return { error: insertError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const updateVenture = useCallback(
    async (id: string, updates: Partial<Pick<Venture, 'name' | 'active'>>) => {
      const { error: updateError } = await supabase.from('ventures').update(updates).eq('id', id);
      if (updateError) return { error: updateError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const archiveVenture = useCallback(
    (id: string) => updateVenture(id, { active: false }),
    [updateVenture]
  );

  const unarchiveVenture = useCallback(
    (id: string) => updateVenture(id, { active: true }),
    [updateVenture]
  );

  return { ventures, loading, error, refresh, addVenture, updateVenture, archiveVenture, unarchiveVenture };
}

export async function fetchAllVentures(): Promise<Venture[]> {
  const { data, error } = await supabase.from('ventures').select('*').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
