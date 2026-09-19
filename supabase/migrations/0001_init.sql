-- Mileage/Tax Tracker V1 schema
-- Single-user app: every row is scoped to auth.uid() via RLS so the schema
-- is ready for multi-user later without changes, but v1 only ever has one
-- signed-in user.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ventures
-- ---------------------------------------------------------------------
create table if not exists ventures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table ventures enable row level security;

create policy "ventures_select_own" on ventures
  for select using (auth.uid() = user_id);
create policy "ventures_insert_own" on ventures
  for insert with check (auth.uid() = user_id);
create policy "ventures_update_own" on ventures
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ventures_delete_own" on ventures
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  venture_id uuid not null references ventures (id) on delete restrict,
  date date not null,
  start_location text not null,
  end_location text not null,
  business_purpose text not null,
  miles numeric(10, 2) not null check (miles > 0),
  created_at timestamptz not null default now()
);

create index if not exists trips_venture_id_idx on trips (venture_id);
create index if not exists trips_date_idx on trips (date);
create index if not exists trips_user_id_idx on trips (user_id);

alter table trips enable row level security;

create policy "trips_select_own" on trips
  for select using (auth.uid() = user_id);
create policy "trips_insert_own" on trips
  for insert with check (auth.uid() = user_id);
create policy "trips_update_own" on trips
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trips_delete_own" on trips
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  venture_id uuid not null references ventures (id) on delete restrict,
  date date not null,
  amount numeric(10, 2) not null check (amount >= 0),
  category text not null check (category in ('gas', 'maintenance', 'supplies', 'other')),
  receipt_photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_venture_id_idx on expenses (venture_id);
create index if not exists expenses_date_idx on expenses (date);
create index if not exists expenses_user_id_idx on expenses (user_id);

alter table expenses enable row level security;

create policy "expenses_select_own" on expenses
  for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on expenses
  for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on expenses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete_own" on expenses
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- odometer_readings
-- Required for IRS compliance: a Jan 1 and Dec 31 reading each year lets
-- total annual miles be reconciled against logged business miles.
-- ---------------------------------------------------------------------
create table if not exists odometer_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  reading numeric(10, 1) not null check (reading >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table odometer_readings enable row level security;

create policy "odometer_readings_select_own" on odometer_readings
  for select using (auth.uid() = user_id);
create policy "odometer_readings_insert_own" on odometer_readings
  for insert with check (auth.uid() = user_id);
create policy "odometer_readings_update_own" on odometer_readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "odometer_readings_delete_own" on odometer_readings
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Storage bucket for receipt photos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Files are stored under `<user_id>/<filename>` so ownership can be
-- checked from the path without an extra lookup table.
create policy "receipts_select_own" on storage.objects
  for select using (
    bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "receipts_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "receipts_update_own" on storage.objects
  for update using (
    bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "receipts_delete_own" on storage.objects
  for delete using (
    bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]
  );
