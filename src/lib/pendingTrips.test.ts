import { beforeEach, describe, expect, it, vi } from 'vitest';

// AsyncStorage's real package pulls in React Native internals that don't
// parse under plain Node/vitest, so it's mocked here with a minimal
// in-memory stand-in. That's fine: this file tests pendingTrips.ts's own
// logic (add/remove/sort/JSON handling), not AsyncStorage itself.
const store = new Map<string, string>();
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  },
}));

const { addPendingTrip, listPendingTrips, removePendingTrip } = await import('./pendingTrips');

beforeEach(() => {
  store.clear();
});

describe('pendingTrips', () => {
  it('starts empty', async () => {
    expect(await listPendingTrips()).toEqual([]);
  });

  it('addPendingTrip assigns an id and detectedAt, and the trip is immediately listable', async () => {
    const added = await addPendingTrip({
      date: '2026-09-19',
      start_location: '40.0000, -75.0000',
      end_location: '40.0300, -75.0000',
      miles: 2.07,
    });
    expect(added.id).toBeTruthy();
    expect(added.detectedAt).toBeTruthy();

    const all = await listPendingTrips();
    expect(all).toHaveLength(1);
    expect(all[0].miles).toBe(2.07);
  });

  it('lists newest-detected first', async () => {
    const first = await addPendingTrip({ date: '2026-09-01', start_location: 'A', end_location: 'B', miles: 1 });
    await new Promise((r) => setTimeout(r, 2));
    const second = await addPendingTrip({ date: '2026-09-02', start_location: 'C', end_location: 'D', miles: 2 });

    const all = await listPendingTrips();
    expect(all[0].id).toBe(second.id);
    expect(all[1].id).toBe(first.id);
  });

  it('removePendingTrip removes only the targeted trip', async () => {
    const a = await addPendingTrip({ date: '2026-09-01', start_location: 'A', end_location: 'B', miles: 1 });
    const b = await addPendingTrip({ date: '2026-09-02', start_location: 'C', end_location: 'D', miles: 2 });

    await removePendingTrip(a.id);

    const all = await listPendingTrips();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(b.id);
  });

  it('removePendingTrip on an unknown id is a harmless no-op', async () => {
    await addPendingTrip({ date: '2026-09-01', start_location: 'A', end_location: 'B', miles: 1 });
    await removePendingTrip('does-not-exist');
    expect(await listPendingTrips()).toHaveLength(1);
  });
});
