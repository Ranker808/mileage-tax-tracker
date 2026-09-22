\set ON_ERROR_STOP off
set client_min_messages to notice;

create temporary table test_scratch (key text primary key, value text);
grant all privileges on test_scratch to authenticated;

set role authenticated;
select set_test_user('11111111-1111-1111-1111-111111111111'); -- Alice

-- 1. Alice creates a venture; user_id should default to her own auth.uid()
insert into public.ventures (name, active) values ('Alice DoorDash', true);
do $$
declare v_user_id uuid;
begin
  select user_id into v_user_id from public.ventures where name = 'Alice DoorDash';
  if v_user_id <> '11111111-1111-1111-1111-111111111111' then
    raise exception 'FAIL: venture user_id did not default to auth.uid(), got %', v_user_id;
  end if;
  raise notice 'PASS: venture user_id defaults to auth.uid()';
end $$;

insert into test_scratch (key, value)
  select 'alice_venture_id', id::text from public.ventures where name = 'Alice DoorDash';

-- 2. Alice logs a trip and an expense against her venture
insert into public.trips (venture_id, date, start_location, end_location, business_purpose, miles)
  select id, '2026-03-01', 'Home', 'Client', 'Delivery', 12.5 from public.ventures where name = 'Alice DoorDash';
insert into public.expenses (venture_id, date, amount, category)
  select id, '2026-03-01', 40.00, 'gas' from public.ventures where name = 'Alice DoorDash';
insert into public.odometer_readings (date, reading) values ('2026-01-01', 50000);

do $$
declare cnt int;
begin
  select count(*) into cnt from public.trips;
  if cnt <> 1 then raise exception 'FAIL: expected 1 visible trip for Alice, got %', cnt; end if;
  raise notice 'PASS: Alice sees her own trip';
end $$;

-- 3. Switch to Bob: he should see NONE of Alice's data
select set_test_user('22222222-2222-2222-2222-222222222222'); -- Bob

do $$
declare v_count int;
begin
  select count(*) into v_count from public.ventures;
  if v_count <> 0 then raise exception 'FAIL: Bob can see % of Alice''s ventures (RLS isolation broken)', v_count; end if;
  raise notice 'PASS: Bob sees zero of Alice''s ventures';

  select count(*) into v_count from public.trips;
  if v_count <> 0 then raise exception 'FAIL: Bob can see Alice''s trips (RLS isolation broken)'; end if;
  raise notice 'PASS: Bob sees zero of Alice''s trips';

  select count(*) into v_count from public.expenses;
  if v_count <> 0 then raise exception 'FAIL: Bob can see Alice''s expenses (RLS isolation broken)'; end if;
  raise notice 'PASS: Bob sees zero of Alice''s expenses';

  select count(*) into v_count from public.odometer_readings;
  if v_count <> 0 then raise exception 'FAIL: Bob can see Alice''s odometer readings (RLS isolation broken)'; end if;
  raise notice 'PASS: Bob sees zero of Alice''s odometer readings';
end $$;

-- 4. Bob cannot spoof Alice's user_id on insert (the WITH CHECK clause must reject this)
do $$
declare v_inserted boolean := false;
begin
  begin
    insert into public.ventures (user_id, name, active)
    values ('11111111-1111-1111-1111-111111111111', 'Spoofed Venture', true);
    v_inserted := true;
  exception
    when insufficient_privilege then
      v_inserted := false;
  end;
  if v_inserted then
    raise exception 'FAIL: Bob was able to insert a venture claiming to be Alice (RLS with-check broken)';
  else
    raise notice 'PASS: Bob cannot insert a venture with someone else''s user_id';
  end if;
end $$;

-- 5. Bob cannot update Alice's venture by id even if he somehow learns its id
do $$
declare v_alice_venture_id uuid;
declare v_rows_affected int;
begin
  select value::uuid into v_alice_venture_id from test_scratch where key = 'alice_venture_id';
  update public.ventures set name = 'Hijacked' where id = v_alice_venture_id;
  get diagnostics v_rows_affected = row_count;
  if v_rows_affected <> 0 then
    raise exception 'FAIL: Bob updated Alice''s venture (RLS update policy broken)';
  end if;
  raise notice 'PASS: Bob''s update to Alice''s venture affected 0 rows';
end $$;

-- 6. Storage RLS: Bob cannot write objects under Alice's user-id folder
-- (the 'receipts' bucket already exists from the real migration, applied
-- earlier as the admin/superuser role, exactly as it would via Supabase's
-- migration tooling — an ordinary authenticated user never creates buckets)
do $$
declare v_inserted boolean := false;
begin
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('receipts', '11111111-1111-1111-1111-111111111111/fake.jpg', '22222222-2222-2222-2222-222222222222');
    v_inserted := true;
  exception
    when insufficient_privilege then
      v_inserted := false;
  end;
  if v_inserted then
    raise exception 'FAIL: Bob inserted a storage object under Alice''s folder (storage RLS broken)';
  else
    raise notice 'PASS: Bob cannot write into Alice''s receipts folder';
  end if;
end $$;

-- 7. Odometer unique(user_id, date) + upsert semantics, back to Alice
select set_test_user('11111111-1111-1111-1111-111111111111');
insert into public.odometer_readings (date, reading) values ('2026-01-01', 50123)
  on conflict (user_id, date) do update set reading = excluded.reading;
do $$
declare v_reading numeric;
declare v_count int;
begin
  select count(*) into v_count from public.odometer_readings where date = '2026-01-01';
  if v_count <> 1 then raise exception 'FAIL: upsert created a duplicate row instead of updating, count=%', v_count; end if;
  select reading into v_reading from public.odometer_readings where date = '2026-01-01';
  if v_reading <> 50123 then raise exception 'FAIL: upsert did not update the reading, got %', v_reading; end if;
  raise notice 'PASS: odometer upsert on (user_id, date) updates in place, no duplicate';
end $$;

-- 8. trips.venture_id has ON DELETE RESTRICT: deleting a venture with logged trips must fail
do $$
declare v_deleted boolean := false;
begin
  begin
    delete from public.ventures where name = 'Alice DoorDash';
    v_deleted := true;
  exception
    when foreign_key_violation then
      v_deleted := false;
  end;
  if v_deleted then
    raise exception 'FAIL: deleted a venture that still has trips referencing it (should be RESTRICTed)';
  else
    raise notice 'PASS: deleting a venture with trips is correctly blocked by ON DELETE RESTRICT';
  end if;
end $$;

-- 9. A trip's miles must be > 0 (check constraint)
do $$
declare v_inserted boolean := false;
begin
  begin
    insert into public.trips (venture_id, date, start_location, end_location, business_purpose, miles)
      select id, '2026-03-02', 'A', 'B', 'test', 0 from public.ventures where name = 'Alice DoorDash';
    v_inserted := true;
  exception
    when check_violation then
      v_inserted := false;
  end;
  if v_inserted then
    raise exception 'FAIL: inserted a trip with 0 miles (check constraint not enforced)';
  else
    raise notice 'PASS: a trip with 0 miles is rejected by the miles > 0 check constraint';
  end if;
end $$;

-- 10. An expense category outside the allowed set must be rejected
do $$
declare v_inserted boolean := false;
begin
  begin
    insert into public.expenses (venture_id, date, amount, category)
      select id, '2026-03-02', 10, 'yacht' from public.ventures where name = 'Alice DoorDash';
    v_inserted := true;
  exception
    when check_violation then
      v_inserted := false;
  end;
  if v_inserted then
    raise exception 'FAIL: inserted an expense with an invalid category (check constraint not enforced)';
  else
    raise notice 'PASS: an invalid expense category is rejected by the check constraint';
  end if;
end $$;

-- 11. The expanded expense categories (0003_expense_categories.sql) are all accepted
do $$
declare v_venture_id uuid;
declare v_count int;
begin
  select id into v_venture_id from public.ventures where name = 'Alice DoorDash';
  insert into public.expenses (venture_id, date, amount, category)
    values
      (v_venture_id, '2026-03-03', 50, 'insurance'),
      (v_venture_id, '2026-03-03', 12, 'parking_tolls'),
      (v_venture_id, '2026-03-03', 30, 'registration_fees'),
      (v_venture_id, '2026-03-03', 8, 'interest');
  select count(*) into v_count from public.expenses
    where category in ('insurance', 'parking_tolls', 'registration_fees', 'interest');
  if v_count <> 4 then
    raise exception 'FAIL: expected all 4 new expense categories to be accepted, got %', v_count;
  end if;
  raise notice 'PASS: the expanded expense categories (insurance/parking_tolls/registration_fees/interest) are all accepted';
end $$;

-- 12. trips.notes (0002_trip_notes.sql) is optional and round-trips correctly
do $$
declare v_venture_id uuid;
declare v_notes text;
begin
  select id into v_venture_id from public.ventures where name = 'Alice DoorDash';
  insert into public.trips (venture_id, date, start_location, end_location, business_purpose, miles, notes)
    values (v_venture_id, '2026-03-04', 'A', 'B', 'test', 3.5, 'hit traffic, took the long way');
  select notes into v_notes from public.trips where date = '2026-03-04';
  if v_notes <> 'hit traffic, took the long way' then
    raise exception 'FAIL: trip notes did not round-trip correctly, got %', v_notes;
  end if;
  -- and it's genuinely optional -- omitting it entirely must not fail
  insert into public.trips (venture_id, date, start_location, end_location, business_purpose, miles)
    values (v_venture_id, '2026-03-05', 'A', 'B', 'test', 3.5);
  raise notice 'PASS: trips.notes is optional and round-trips correctly when provided';
end $$;

reset role;
