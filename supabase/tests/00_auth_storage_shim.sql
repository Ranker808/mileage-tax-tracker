-- Minimal shim replicating the parts of Supabase's built-in `auth` schema
-- that our migration depends on: an auth.users table for the FK, and the
-- real auth.uid() implementation (reads the JWT sub claim from a Postgres
-- session setting), so RLS policies behave exactly as they would on
-- Supabase.
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- Helper used only in this test session to simulate "signed in as user X".
create or replace function set_test_user(u uuid) returns void
language sql
as $$
  select set_config('request.jwt.claim.sub', u::text, false);
$$;
-- Minimal shim for the parts of Supabase's `storage` schema our migration
-- touches (bucket creation + storage.objects RLS policies).
create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid
);

alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable
as $$
  select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
$$;
