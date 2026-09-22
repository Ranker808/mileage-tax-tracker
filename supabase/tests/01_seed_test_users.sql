-- Create a non-superuser role mimicking Supabase's "authenticated" role,
-- so RLS is actually enforced (the postgres superuser bypasses RLS
-- entirely, which would make any RLS test against it meaningless).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end $$;

grant usage on schema public, auth, storage to authenticated;
grant select, insert, update, delete on public.ventures, public.trips, public.expenses, public.odometer_readings, public.income to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on auth.users to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com')
on conflict (id) do nothing;
