// In-memory backing store for Demo Mode. Lets someone click through the
// whole app (add/edit/archive/delete, one-tap reassignment, everything)
// without a Supabase project. Resets whenever the app reloads — that's
// intentional, a demo isn't meant to be durable storage.
import type { Expense, OdometerReading, Trip, Venture } from '../types/database';

const DEMO_USER_ID = 'demo-user';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function initialVentures(): Venture[] {
  return [
    { id: 'v1', user_id: DEMO_USER_ID, name: 'DoorDash', active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'v2', user_id: DEMO_USER_ID, name: 'Notary', active: true, created_at: '2026-01-01T00:00:00Z' },
    { id: 'v3', user_id: DEMO_USER_ID, name: 'IT Support', active: true, created_at: '2026-01-01T00:00:00Z' },
  ];
}

function initialTrips(): Trip[] {
  return [
    { id: 't1', user_id: DEMO_USER_ID, venture_id: 'v1', date: '2026-09-15', start_location: 'Home', end_location: '412 Oak St', business_purpose: 'Delivery run', miles: 8.4, created_at: '2026-09-15T00:00:00Z' },
    { id: 't2', user_id: DEMO_USER_ID, venture_id: 'v2', date: '2026-09-12', start_location: 'Home office', end_location: 'Client signing', business_purpose: 'Notarization appointment', miles: 14.1, created_at: '2026-09-12T00:00:00Z' },
    { id: 't3', user_id: DEMO_USER_ID, venture_id: 'v3', date: '2026-08-30', start_location: 'Home office', end_location: 'Client site', business_purpose: 'Server maintenance', miles: 22.7, created_at: '2026-08-30T00:00:00Z' },
    { id: 't4', user_id: DEMO_USER_ID, venture_id: 'v1', date: '2026-08-28', start_location: 'Home', end_location: '90 Elm Ave', business_purpose: 'Delivery run', miles: 5.9, created_at: '2026-08-28T00:00:00Z' },
  ];
}

function initialExpenses(): Expense[] {
  return [
    { id: 'e1', user_id: DEMO_USER_ID, venture_id: 'v1', date: '2026-09-14', amount: 42.5, category: 'gas', receipt_photo_url: null, notes: 'Fill up', created_at: '2026-09-14T00:00:00Z' },
    { id: 'e2', user_id: DEMO_USER_ID, venture_id: 'v3', date: '2026-09-01', amount: 129.0, category: 'supplies', receipt_photo_url: null, notes: 'Replacement router', created_at: '2026-09-01T00:00:00Z' },
    { id: 'e3', user_id: DEMO_USER_ID, venture_id: 'v2', date: '2026-08-20', amount: 65.0, category: 'maintenance', receipt_photo_url: null, notes: 'Oil change', created_at: '2026-08-20T00:00:00Z' },
  ];
}

function initialOdometerReadings(): OdometerReading[] {
  return [{ id: 'o1', user_id: DEMO_USER_ID, date: '2026-01-01', reading: 41250.0, created_at: '2026-01-01T00:00:00Z' }];
}

let ventures = initialVentures();
let trips = initialTrips();
let expenses = initialExpenses();
let odometerReadings = initialOdometerReadings();

/** Restores the demo store to its original seed data. Used by tests, and available for a future "Reset Demo Data" action. */
export function resetDemoStore(): void {
  ventures = initialVentures();
  trips = initialTrips();
  expenses = initialExpenses();
  odometerReadings = initialOdometerReadings();
}

export const demoStore = {
  userId: DEMO_USER_ID,

  // ---- ventures ----
  listVentures(includeArchived: boolean): Venture[] {
    const rows = includeArchived ? ventures : ventures.filter((v) => v.active);
    return [...rows].sort((a, b) => a.name.localeCompare(b.name));
  },
  fetchAllVentures(): Venture[] {
    return [...ventures].sort((a, b) => a.name.localeCompare(b.name));
  },
  addVenture(name: string): { error: string | null } {
    ventures = [...ventures, { id: uid('v'), user_id: DEMO_USER_ID, name, active: true, created_at: nowIso() }];
    return { error: null };
  },
  updateVenture(id: string, updates: Partial<Pick<Venture, 'name' | 'active'>>): { error: string | null } {
    ventures = ventures.map((v) => (v.id === id ? { ...v, ...updates } : v));
    return { error: null };
  },

  // ---- trips ----
  listTrips(filter: { ventureId?: string | null; startDate?: string | null; endDate?: string | null }): Trip[] {
    return trips
      .filter((t) => !filter.ventureId || t.venture_id === filter.ventureId)
      .filter((t) => !filter.startDate || t.date >= filter.startDate)
      .filter((t) => !filter.endDate || t.date <= filter.endDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  fetchTrip(id: string): Trip | null {
    return trips.find((t) => t.id === id) ?? null;
  },
  addTrip(input: Omit<Trip, 'id' | 'user_id' | 'created_at'>): { error: string | null } {
    trips = [...trips, { ...input, id: uid('t'), user_id: DEMO_USER_ID, created_at: nowIso() }];
    return { error: null };
  },
  updateTrip(id: string, updates: Partial<Omit<Trip, 'id' | 'user_id' | 'created_at'>>): { error: string | null } {
    trips = trips.map((t) => (t.id === id ? { ...t, ...updates } : t));
    return { error: null };
  },
  deleteTrip(id: string): { error: string | null } {
    trips = trips.filter((t) => t.id !== id);
    return { error: null };
  },
  bulkDeleteTrips(ids: string[]): { error: string | null } {
    const idSet = new Set(ids);
    trips = trips.filter((t) => !idSet.has(t.id));
    return { error: null };
  },
  bulkUpdateTripVenture(ids: string[], ventureId: string): { error: string | null } {
    const idSet = new Set(ids);
    trips = trips.map((t) => (idSet.has(t.id) ? { ...t, venture_id: ventureId } : t));
    return { error: null };
  },

  // ---- expenses ----
  listExpenses(filter: { ventureId?: string | null; startDate?: string | null; endDate?: string | null }): Expense[] {
    return expenses
      .filter((e) => !filter.ventureId || e.venture_id === filter.ventureId)
      .filter((e) => !filter.startDate || e.date >= filter.startDate)
      .filter((e) => !filter.endDate || e.date <= filter.endDate)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  fetchExpense(id: string): Expense | null {
    return expenses.find((e) => e.id === id) ?? null;
  },
  addExpense(input: Omit<Expense, 'id' | 'user_id' | 'created_at'>): { error: string | null } {
    expenses = [...expenses, { ...input, id: uid('e'), user_id: DEMO_USER_ID, created_at: nowIso() }];
    return { error: null };
  },
  updateExpense(id: string, updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>): { error: string | null } {
    expenses = expenses.map((e) => (e.id === id ? { ...e, ...updates } : e));
    return { error: null };
  },
  deleteExpense(id: string): { error: string | null } {
    expenses = expenses.filter((e) => e.id !== id);
    return { error: null };
  },

  // ---- odometer readings ----
  listOdometerReadings(): OdometerReading[] {
    return [...odometerReadings].sort((a, b) => (a.date < b.date ? 1 : -1));
  },
  addOdometerReading(date: string, reading: number): { error: string | null } {
    const existing = odometerReadings.find((r) => r.date === date);
    if (existing) {
      odometerReadings = odometerReadings.map((r) => (r.date === date ? { ...r, reading } : r));
    } else {
      odometerReadings = [...odometerReadings, { id: uid('o'), user_id: DEMO_USER_ID, date, reading, created_at: nowIso() }];
    }
    return { error: null };
  },
  deleteOdometerReading(id: string): { error: string | null } {
    odometerReadings = odometerReadings.filter((r) => r.id !== id);
    return { error: null };
  },
};
