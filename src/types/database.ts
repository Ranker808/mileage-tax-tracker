export type ExpenseCategory = 'gas' | 'maintenance' | 'supplies' | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['gas', 'maintenance', 'supplies', 'other'];

export interface Venture {
  id: string;
  user_id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  venture_id: string;
  date: string; // YYYY-MM-DD
  start_location: string;
  end_location: string;
  business_purpose: string;
  miles: number;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  venture_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: ExpenseCategory;
  receipt_photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface OdometerReading {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  reading: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      ventures: {
        Row: Venture;
        Insert: Omit<Venture, 'id' | 'user_id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Venture, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      trips: {
        Row: Trip;
        Insert: Omit<Trip, 'id' | 'user_id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Trip, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'user_id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
      odometer_readings: {
        Row: OdometerReading;
        Insert: Omit<OdometerReading, 'id' | 'user_id' | 'created_at'> & { id?: string };
        Update: Partial<Omit<OdometerReading, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
