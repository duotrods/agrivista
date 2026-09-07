-- AgriVista Phase 0 schema: minimal profiles, rice_fields, field_media
-- Run this in the Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'farmer' check (role in ('farmer', 'lgu_staff')),
  barangay text,
  created_at timestamptz not null default now()
);

create table if not exists rice_fields (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references profiles (id) on delete cascade,
  field_name text not null,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  barangay text,
  created_at timestamptz not null default now()
);

create table if not exists field_media (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references rice_fields (id) on delete cascade,
  file_url text not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, barangay)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'farmer'),
    new.raw_user_meta_data ->> 'barangay'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table rice_fields enable row level security;
alter table field_media enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Farmers can view own fields" on rice_fields
  for select using (auth.uid() = farmer_id);

create policy "Farmers can insert own fields" on rice_fields
  for insert with check (auth.uid() = farmer_id);

create policy "Farmers can update own fields" on rice_fields
  for update using (auth.uid() = farmer_id);

create policy "Farmers can view media for own fields" on field_media
  for select using (
    exists (
      select 1 from rice_fields
      where rice_fields.id = field_media.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

create policy "Farmers can insert media for own fields" on field_media
  for insert with check (
    exists (
      select 1 from rice_fields
      where rice_fields.id = field_media.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );
