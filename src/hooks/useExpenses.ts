import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { deleteReceiptPhoto } from '../lib/receipts';
import { isDemoMode } from '../lib/demoMode';
import { demoStore } from '../lib/demoStore';
import type { Expense } from '../types/database';

export interface ExpenseFilter {
  ventureId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export type ExpenseInput = Omit<Expense, 'id' | 'user_id' | 'created_at'>;

export function useExpenses(filter: ExpenseFilter = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    if (isDemoMode()) {
      setError(null);
      setExpenses(demoStore.listExpenses(filter));
      setLoading(false);
      return;
    }
    let query = supabase.from('expenses').select('*').order('date', { ascending: false });
    if (filter.ventureId) query = query.eq('venture_id', filter.ventureId);
    if (filter.startDate) query = query.gte('date', filter.startDate);
    if (filter.endDate) query = query.lte('date', filter.endDate);
    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setExpenses(data ?? []);
    }
    setLoading(false);
  }, [filter.ventureId, filter.startDate, filter.endDate]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      if (isDemoMode()) {
        const result = demoStore.addExpense(input);
        await refresh();
        return result;
      }
      const { error: insertError } = await supabase.from('expenses').insert(input);
      if (insertError) return { error: insertError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const updateExpense = useCallback(
    async (id: string, updates: Partial<ExpenseInput>) => {
      if (isDemoMode()) {
        const result = demoStore.updateExpense(id, updates);
        await refresh();
        return result;
      }
      const { error: updateError } = await supabase.from('expenses').update(updates).eq('id', id);
      if (updateError) return { error: updateError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (isDemoMode()) {
        const result = demoStore.deleteExpense(id);
        await refresh();
        return result;
      }
      const { data: existing } = await supabase
        .from('expenses')
        .select('receipt_photo_url')
        .eq('id', id)
        .maybeSingle();
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
      if (deleteError) return { error: deleteError.message };
      if (existing?.receipt_photo_url) {
        await deleteReceiptPhoto(existing.receipt_photo_url);
      }
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { expenses, loading, error, refresh, addExpense, updateExpense, deleteExpense };
}

export async function fetchExpense(id: string): Promise<Expense | null> {
  if (isDemoMode()) {
    return demoStore.fetchExpense(id);
  }
  const { data, error } = await supabase.from('expenses').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
