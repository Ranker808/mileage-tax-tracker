-- Income tracking, per venture. Mirrors the expenses table's structure
-- and RLS policies exactly (venture-scoped, dated, amount, notes) minus
-- category/receipt, plus a "source" field -- lets Reports show real
-- business profit (income - expenses), not just the tax-deduction side.
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  venture_id uuid not null references ventures (id) on delete restrict,
  date date not null,
  amount numeric(10, 2) not null check (amount >= 0),
  source text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists income_venture_id_idx on income (venture_id);
create index if not exists income_date_idx on income (date);
create index if not exists income_user_id_idx on income (user_id);

alter table income enable row level security;

create policy "income_select_own" on income
  for select using (auth.uid() = user_id);
create policy "income_insert_own" on income
  for insert with check (auth.uid() = user_id);
create policy "income_update_own" on income
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "income_delete_own" on income
  for delete using (auth.uid() = user_id);
