# Mileage & Tax Tracker (V1)

A personal, single-user mobile app for tracking mileage and expenses across
multiple side ventures, for IRS-compliant deductions. Built with Expo
(React Native) and Supabase.

> "Hurdlr and Everlance tell you what you owe. This tells you which of your
> businesses is actually working — and it doesn't lock your own data behind
> a subscription to see it."

## Stack

- **Expo / React Native** (SDK 57) with `expo-router` for navigation
- **Supabase** (Postgres + Auth + Storage) — single-user for v1, but RLS is
  scoped per-user from day one so it's ready for multi-user later
- No web app / Next.js — this is a mobile-first tool

## Features (V1)

1. Ventures CRUD (add / edit / archive)
2. Manual trip logging with all 5 IRS-required fields
3. Automatic mileage rate engine (2026 split-year: 72.5¢ Jan–Jun, 76¢ Jul–Dec)
4. Expense logging with an optional receipt photo
5. Per-venture P&L view — total miles, mileage deduction, expenses, net
   deductible, filterable by venture and date range
6. One-tap venture reassignment on any trip (list row badge or trip detail
   screen — no multi-step flow, no hangs)
7. Unrestricted CSV/PDF export — no paywall, ever, on your own data
8. Odometer reading reminders — an in-app banner near Jan 1 / Dec 31 on the
   Settings screen (no push notifications; see "Notifications" below)

Plus a **Demo Mode** ("Try Demo" on the sign-in screen) for trying the app
with zero setup — see below.

## Getting Started

### Just want to click through it? (zero setup)

```bash
npm install --legacy-peer-deps
npm run web
```

Open the printed `localhost` URL, hit **Try Demo** on the sign-in screen.
That's a real, fully interactive build of the app — add/edit ventures,
log trips and expenses, one-tap reassign, export — running against an
in-memory sample dataset instead of Supabase. Nothing is saved and it
resets on reload; it exists purely so you can see the app work without
creating an account first. (Works in Expo Go / a simulator too, not just
web — `npm start` and press "Try Demo" there as well.)

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then run the
migration in `supabase/migrations/0001_init.sql` against it (via the SQL
editor in the dashboard, or the Supabase CLI: `supabase db push`).

This creates the `ventures`, `trips`, `expenses`, and `odometer_readings`
tables (all with row-level security scoped to `auth.uid()`), plus a private
`receipts` storage bucket for expense photos.

### 2. Create your user

Since this is a single-user app, create the one account you'll sign in with
via the Supabase dashboard (Authentication → Users → Add user), or by
enabling email sign-ups and using the app's sign-in screen once you've
temporarily wired up a sign-up call. There's no in-app sign-up flow by
design (see `mileage-tracker-future-sell-plan.md` for why).

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from
your Supabase project's API settings.

### 4. Install and run

```bash
npm install --legacy-peer-deps
npm start
```

(`--legacy-peer-deps` is needed because of a peer-dependency version skew
between `react-dom` and `react` baked into the current Expo SDK 57
template's own transitive deps — unrelated to anything in this app.)

Then open the app in Expo Go, an iOS/Android simulator, or a dev build.

## Testing & Verification

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run — pure-logic unit tests
```

`npm test` covers the mileage rate engine, report rollup math, CSV
escaping/formatting, filename sanitization, and the odometer reminder
window — the parts of the app that are pure functions and don't need a
backend.

The parts that *do* need a backend (RLS policies, constraints, the
odometer upsert) are covered separately in `supabase/tests/`, which spins
up a throwaway local Postgres database, applies the real
`supabase/migrations/0001_init.sql` unmodified, and runs it as two
simulated users through a non-superuser role (RLS is a no-op for
superusers, so this matters) to assert real isolation:

```bash
supabase/tests/run.sh
```

It checks, against an actual database rather than by inspection: a new
venture's `user_id` defaults to the signed-in user; a second user sees
none of the first user's ventures/trips/expenses/odometer readings; a
user can't insert a row claiming someone else's `user_id`; a user can't
update another user's row even by guessing its id; the private receipts
storage bucket is isolated the same way; the odometer `(user_id, date)`
upsert updates in place instead of duplicating; deleting a venture with
logged trips is blocked; and the `miles > 0` / valid-category check
constraints reject bad data. Needs a local Postgres reachable as a
superuser (`createdb`/`dropdb`/`psql` on your PATH) — nothing else.

## Project Structure

```
app/                      expo-router screens
  (tabs)/                  Trips, Expenses, Ventures, Reports, Settings tabs
  trip/, expense/,
  venture/, odometer/      add/edit/detail screens (pushed from tabs)
src/
  components/              shared UI (forms, venture pickers, empty states)
  hooks/                   Supabase-backed data hooks (ventures/trips/expenses/odometer)
  lib/                     supabase client, mileage rate engine, CSV/PDF export, formatting
  types/                   Database row types
supabase/
  migrations/              SQL schema + RLS policies + storage bucket
```

## Mileage Rate Engine

Rates live in `src/lib/mileageRates.ts` as a simple date-range schedule:

```ts
export const MILEAGE_RATE_SCHEDULE: MileageRatePeriod[] = [
  { label: '2026 Jan–Jun', startDate: '2026-01-01', endDate: '2026-06-30', ratePerMile: 0.725 },
  { label: '2026 Jul–Dec', startDate: '2026-07-01', endDate: '2026-12-31', ratePerMile: 0.76 },
];
```

Each trip's deduction is calculated from its own date, so add a new period
to this list whenever the IRS publishes a new rate (including future
mid-year splits).

## Demo Mode

`src/lib/demoMode.ts` (a module-level flag) and `src/lib/demoStore.ts` (an
in-memory CRUD store seeded with sample data) let the whole app run
without Supabase. Every data hook (`useVentures`, `useTrips`,
`useExpenses`, `useOdometerReadings`) and `src/lib/receipts.ts` branch on
`isDemoMode()` at the top of each operation — same public API either way,
so screens don't know or care which backend they're talking to.
`useAuth().enterDemoMode()` sets both the flag and a fake session; signing
out clears both. It's exercised the same way the rest of the app is: real
clicks in a real browser (see `Testing & Verification`), not just unit
tests against the store in isolation.

## Notifications

Off by default, and there is no push notification permission request
anywhere in the app. The odometer reminder is a plain in-app banner on the
Settings screen — that's it.

## Notes on Dependencies

`@supabase/supabase-js` is pinned to `2.45.4` (not a caret range) because
newer 2.x releases ship a generated-types generic chain that TypeScript
fails to resolve for hand-written `Database` types in this project's
toolchain, turning every `.insert()`/`.update()` call into a `never` type
error. If you upgrade this dependency, re-run `npx tsc --noEmit` first.

## What's Explicitly Not in V1

Automatic background GPS tracking, multi-user auth, payments/licensing,
OCR receipt scanning, and an onboarding flow are all deferred — see
`mileage-tracker-future-sell-plan.md`.
