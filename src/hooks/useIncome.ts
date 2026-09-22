import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/demoMode';
import { demoStore } from '../lib/demoStore';
import type { Income } from '../types/database';

export interface IncomeFilter {
  ventureId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export type IncomeInput = Omit<Income, 'id' | 'user_id' | 'created_at'>;

export function useIncome(filter: IncomeFilter = {}) {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (isDemoMode()) {
      setError(null);
      setIncome(demoStore.listIncome(filter));
      setLoading(false);
      return;
    }
    let query = supabase.from('income').select('*').order('date', { ascending: false });
    if (filter.ventureId) query = query.eq('venture_id', filter.ventureId);
    if (filter.startDate) query = query.gte('date', filter.startDate);
    if (filter.endDate) query = query.lte('date', filter.endDate);
    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setIncome(data ?? []);
    }
    setLoading(false);
  }, [filter.ventureId, filter.startDate, filter.endDate]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const addIncome = useCallback(
    async (input: IncomeInput) => {
      if (isDemoMode()) {
        const result = demoStore.addIncome(input);
        await refresh();
        return result;
      }
      const { error: insertError } = await supabase.from('income').insert(input);
      if (insertError) return { error: insertError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const updateIncome = useCallback(
    async (id: string, updates: Partial<IncomeInput>) => {
      if (isDemoMode()) {
        const result = demoStore.updateIncome(id, updates);
        await refresh();
        return result;
      }
      const { error: updateError } = await supabase.from('income').update(updates).eq('id', id);
      if (updateError) return { error: updateError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      if (isDemoMode()) {
        const result = demoStore.deleteIncome(id);
        await refresh();
        return result;
      }
      const { error: deleteError } = await supabase.from('income').delete().eq('id', id);
      if (deleteError) return { error: deleteError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { income, loading, error, refresh, addIncome, updateIncome, deleteIncome };
}

export async function fetchIncome(id: string): Promise<Income | null> {
  if (isDemoMode()) {
    return demoStore.fetchIncome(id);
  }
  const { data, error } = await supabase.from('income').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
