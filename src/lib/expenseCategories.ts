import type { Ionicons } from '@expo/vector-icons';
import type { ExpenseCategory } from '../types/database';

export interface ExpenseCategoryMeta {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Single source of truth for category display, shared by the expense form,
// the expenses list, and CSV export -- previously duplicated in both.
export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  gas: { label: 'Gas', icon: 'flame-outline' },
  maintenance: { label: 'Maintenance', icon: 'construct-outline' },
  supplies: { label: 'Supplies', icon: 'cube-outline' },
  insurance: { label: 'Insurance', icon: 'shield-checkmark-outline' },
  parking_tolls: { label: 'Parking & Tolls', icon: 'ticket-outline' },
  registration_fees: { label: 'Registration & Fees', icon: 'document-text-outline' },
  interest: { label: 'Interest', icon: 'trending-up-outline' },
  other: { label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
};
