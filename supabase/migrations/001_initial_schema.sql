create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  age integer,
  diabetes_type text,
  diagnosis_date date,
  hba1c numeric(4,1),
  insulin_regimen text,
  last_glucose numeric(6,1),
  risk_today text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_risk_today_check check (risk_today in ('LOW', 'MEDIUM', 'HIGH') or risk_today is null),
  constraint profiles_age_check check (age is null or age between 0 and 130),
  constraint profiles_hba1c_check check (hba1c is null or hba1c between 0 and 30),
  constraint profiles_last_glucose_check check (last_glucose is null or last_glucose between 0 and 500)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_updated_at_idx on public.profiles (updated_at desc);
create index if not exists predictions_user_id_created_at_idx on public.predictions (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profiles_updated_at on public.profiles;
create trigger on_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.predictions enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "predictions_select_own"
on public.predictions
for select
using (auth.uid() = user_id);

create policy "predictions_insert_own"
on public.predictions
for insert
with check (auth.uid() = user_id);

create policy "predictions_delete_own"
on public.predictions
for delete
using (auth.uid() = user_id);
