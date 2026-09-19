import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/demoMode';
import { demoStore } from '../lib/demoStore';
import type { Venture } from '../types/database';

export function useVentures(includeArchived = false) {
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (isDemoMode()) {
      setError(null);
      setVentures(demoStore.listVentures(includeArchived));
      setLoading(false);
      return;
    }
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

  // useFocusEffect (not useEffect) so navigating back to an
  // already-mounted screen — e.g. after adding a venture from the "+"
  // form — re-fetches instead of showing stale data. React Navigation
  // keeps screens mounted rather than unmounting them on back, so a
  // plain mount-only effect only ever fires once.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const addVenture = useCallback(
    async (name: string) => {
      if (isDemoMode()) {
        const result = demoStore.addVenture(name);
        await refresh();
        return result;
      }
      const { error: insertError } = await supabase.from('ventures').insert({ name, active: true });
      if (insertError) return { error: insertError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const updateVenture = useCallback(
    async (id: string, updates: Partial<Pick<Venture, 'name' | 'active'>>) => {
      if (isDemoMode()) {
        const result = demoStore.updateVenture(id, updates);
        await refresh();
        return result;
      }
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
  if (isDemoMode()) {
    return demoStore.fetchAllVentures();
  }
  const { data, error } = await supabase.from('ventures').select('*').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
