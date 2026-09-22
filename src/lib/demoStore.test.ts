import { beforeEach, describe, expect, it } from 'vitest';
import { demoStore, resetDemoStore } from './demoStore';

beforeEach(() => {
  resetDemoStore();
});

describe('demoStore ventures', () => {
  it('seeds three active ventures', () => {
    expect(demoStore.listVentures(false)).toHaveLength(3);
  });

  it('addVenture makes the new venture immediately listable', () => {
    demoStore.addVenture('Freelance Writing');
    const names = demoStore.listVentures(true).map((v) => v.name);
    expect(names).toContain('Freelance Writing');
  });

  it('archiving a venture removes it from the active list but not the full list', () => {
    const [first] = demoStore.listVentures(false);
    demoStore.updateVenture(first.id, { active: false });
    expect(demoStore.listVentures(false).find((v) => v.id === first.id)).toBeUndefined();
    expect(demoStore.listVentures(true).find((v) => v.id === first.id)).toBeDefined();
  });
});

describe('demoStore trips', () => {
  it('seeds four trips', () => {
    expect(demoStore.listTrips({})).toHaveLength(4);
  });

  it('addTrip appends a trip with a generated id, and it is immediately fetchable', () => {
    const before = demoStore.listTrips({}).length;
    demoStore.addTrip({
      venture_id: 'v1',
      date: '2026-09-19',
      start_location: 'A',
      end_location: 'B',
      business_purpose: 'Test',
      miles: 10,
      notes: null,
    });
    const all = demoStore.listTrips({});
    expect(all).toHaveLength(before + 1);
    const added = all.find((t) => t.business_purpose === 'Test');
    expect(added).toBeDefined();
    expect(demoStore.fetchTrip(added!.id)).toEqual(added);
  });

  it('updateTrip supports one-tap venture reassignment', () => {
    const [trip] = demoStore.listTrips({});
    const newVenture = trip.venture_id === 'v1' ? 'v2' : 'v1';
    demoStore.updateTrip(trip.id, { venture_id: newVenture });
    expect(demoStore.fetchTrip(trip.id)?.venture_id).toBe(newVenture);
  });

  it('listTrips filters by ventureId', () => {
    const filtered = demoStore.listTrips({ ventureId: 'v1' });
    expect(filtered.every((t) => t.venture_id === 'v1')).toBe(true);
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('deleteTrip removes it', () => {
    const [trip] = demoStore.listTrips({});
    demoStore.deleteTrip(trip.id);
    expect(demoStore.fetchTrip(trip.id)).toBeNull();
  });

  it('bulkDeleteTrips removes exactly the given ids and leaves the rest', () => {
    const all = demoStore.listTrips({});
    const [first, second] = all;
    demoStore.bulkDeleteTrips([first.id, second.id]);
    const remaining = demoStore.listTrips({});
    expect(remaining).toHaveLength(all.length - 2);
    expect(remaining.some((t) => t.id === first.id || t.id === second.id)).toBe(false);
  });

  it('bulkUpdateTripVenture reassigns exactly the given ids and leaves the rest', () => {
    const all = demoStore.listTrips({});
    const [first, second, ...rest] = all;
    const targetVenture = first.venture_id === 'v3' ? 'v2' : 'v3';
    demoStore.bulkUpdateTripVenture([first.id, second.id], targetVenture);
    expect(demoStore.fetchTrip(first.id)?.venture_id).toBe(targetVenture);
    expect(demoStore.fetchTrip(second.id)?.venture_id).toBe(targetVenture);
    for (const t of rest) {
      expect(demoStore.fetchTrip(t.id)?.venture_id).toBe(t.venture_id);
    }
  });
});

describe('demoStore expenses', () => {
  it('addExpense then deleteExpense round-trips cleanly', () => {
    demoStore.addExpense({
      venture_id: 'v1',
      date: '2026-09-19',
      amount: 20,
      category: 'other',
      receipt_photo_url: null,
      notes: null,
    });
    const added = demoStore.listExpenses({}).find((e) => e.amount === 20);
    expect(added).toBeDefined();
    demoStore.deleteExpense(added!.id);
    expect(demoStore.fetchExpense(added!.id)).toBeNull();
  });
});

describe('demoStore odometer readings', () => {
  it('addOdometerReading upserts by date instead of duplicating', () => {
    const before = demoStore.listOdometerReadings().length;
    demoStore.addOdometerReading('2026-01-01', 99999); // same date as the seeded reading
    const readings = demoStore.listOdometerReadings();
    expect(readings).toHaveLength(before);
    expect(readings.find((r) => r.date === '2026-01-01')?.reading).toBe(99999);
  });

  it('addOdometerReading on a new date adds a new row', () => {
    const before = demoStore.listOdometerReadings().length;
    demoStore.addOdometerReading('2026-12-31', 55000);
    expect(demoStore.listOdometerReadings()).toHaveLength(before + 1);
  });
});

describe('resetDemoStore', () => {
  it('restores the original seed data after mutations', () => {
    demoStore.addVenture('Temporary');
    demoStore.deleteTrip(demoStore.listTrips({})[0].id);
    resetDemoStore();
    expect(demoStore.listVentures(true).some((v) => v.name === 'Temporary')).toBe(false);
    expect(demoStore.listTrips({})).toHaveLength(4);
  });
});
