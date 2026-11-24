-- AgriVista: complete database setup for a NEW, EMPTY Supabase project.
-- Generated from supabase/migrations by supabase/setup/build.mjs. Do not edit by hand.
--
-- Run it once in the Supabase SQL Editor. It is not meant to be re-run on a project that
-- already has the tables (some policies are created without a "drop if exists").
-- Includes 25 migrations: 0001_phase0_schema.sql to 0025_remove_unused_settings.sql.

-- ============================================================
-- 0001_phase0_schema.sql
-- ============================================================
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

-- ============================================================
-- 0002_storage.sql
-- ============================================================
-- AgriVista Phase 0 storage: 'media' bucket for field photos.
-- Run this in the Supabase SQL Editor after 0001_phase0_schema.sql.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public can view media" on storage.objects
  for select using (bucket_id = 'media');

create policy "Authenticated users can upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

-- ============================================================
-- 0003_phase1_fields.sql
-- ============================================================
-- AgriVista Phase 1: field metadata, boundary polygon, status history.
-- Run this in the Supabase SQL Editor after 0001 and 0002.

alter table rice_fields
  add column if not exists crop_variety text,
  add column if not exists soil_type text,
  add column if not exists irrigation_type text,
  add column if not exists planting_date date,
  add column if not exists expected_harvest date,
  add column if not exists polygon_coords jsonb,
  add column if not exists area_hectares decimal(6, 2),
  add column if not exists field_status text not null default 'fallow';

alter table rice_fields
  drop constraint if exists rice_fields_field_status_check;
alter table rice_fields
  add constraint rice_fields_field_status_check
  check (field_status in ('fallow', 'land_prep', 'planted', 'growing', 'harvested'));

drop policy if exists "Farmers can delete own fields" on rice_fields;
create policy "Farmers can delete own fields" on rice_fields
  for delete using (auth.uid() = farmer_id);

create table if not exists field_status_logs (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references rice_fields (id) on delete cascade,
  changed_by uuid not null references profiles (id),
  old_status text,
  new_status text not null,
  remarks text,
  created_at timestamptz not null default now()
);

alter table field_status_logs enable row level security;

drop policy if exists "Farmers can view status logs for own fields" on field_status_logs;
create policy "Farmers can view status logs for own fields" on field_status_logs
  for select using (
    exists (
      select 1 from rice_fields
      where rice_fields.id = field_status_logs.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "Farmers can insert status logs for own fields" on field_status_logs;
create policy "Farmers can insert status logs for own fields" on field_status_logs
  for insert with check (
    exists (
      select 1 from rice_fields
      where rice_fields.id = field_status_logs.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

-- ============================================================
-- 0004_phase2_media.sql
-- ============================================================
-- AgriVista Phase 2: media types (photo / 360 panorama / video) + captions.
-- Run this in the Supabase SQL Editor after 0001-0003.

alter table field_media
  add column if not exists uploaded_by uuid references profiles (id),
  add column if not exists media_type text not null default 'photo',
  add column if not exists caption text;

alter table field_media
  drop constraint if exists field_media_media_type_check;
alter table field_media
  add constraint field_media_media_type_check
  check (media_type in ('photo', 'panorama_360', 'video'));

-- ============================================================
-- 0005_phase3_crops.sql
-- ============================================================
-- AgriVista Phase 3: crop cycles (planting seasons) and periodic observations.
-- Run this in the Supabase SQL Editor after 0001-0004.

create table if not exists crop_cycles (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references rice_fields (id) on delete cascade,
  season text not null check (season in ('wet', 'dry')),
  year integer not null,
  crop_variety text,
  planting_date date not null,
  harvest_date date,
  yield_kg decimal(10, 2),
  status text not null default 'ongoing' check (status in ('ongoing', 'completed', 'failed')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists crop_observations (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references crop_cycles (id) on delete cascade,
  observed_by uuid not null references profiles (id),
  observation_date date not null default current_date,
  growth_stage text not null
    check (growth_stage in ('seedling', 'tillering', 'booting', 'heading', 'ripening')),
  health_status text not null default 'healthy'
    check (health_status in ('healthy', 'pest_affected', 'diseased', 'drought_stressed')),
  pest_type text,
  remarks text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table crop_cycles enable row level security;
alter table crop_observations enable row level security;

drop policy if exists "Farmers can view own crop cycles" on crop_cycles;
create policy "Farmers can view own crop cycles" on crop_cycles
  for select using (
    exists (
      select 1 from rice_fields
      where rice_fields.id = crop_cycles.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "Farmers can insert own crop cycles" on crop_cycles;
create policy "Farmers can insert own crop cycles" on crop_cycles
  for insert with check (
    exists (
      select 1 from rice_fields
      where rice_fields.id = crop_cycles.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "Farmers can update own crop cycles" on crop_cycles;
create policy "Farmers can update own crop cycles" on crop_cycles
  for update using (
    exists (
      select 1 from rice_fields
      where rice_fields.id = crop_cycles.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "Farmers can view observations for own cycles" on crop_observations;
create policy "Farmers can view observations for own cycles" on crop_observations
  for select using (
    exists (
      select 1 from crop_cycles
      join rice_fields on rice_fields.id = crop_cycles.field_id
      where crop_cycles.id = crop_observations.cycle_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "Farmers can insert observations for own cycles" on crop_observations;
create policy "Farmers can insert observations for own cycles" on crop_observations
  for insert with check (
    exists (
      select 1 from crop_cycles
      join rice_fields on rice_fields.id = crop_cycles.field_id
      where crop_cycles.id = crop_observations.cycle_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

-- ============================================================
-- 0006_phase4_notes.sql
-- ============================================================
-- AgriVista Phase 4: field notes (comments), public or private to the author.

create table if not exists field_notes (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references rice_fields (id) on delete cascade,
  author_id uuid not null references profiles (id),
  content text not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

alter table field_notes enable row level security;

drop policy if exists "Farmers can view non-private notes or own notes" on field_notes;
create policy "Farmers can view non-private notes or own notes" on field_notes
  for select using (
    auth.uid() = author_id
    or (
      is_private = false
      and exists (
        select 1 from rice_fields
        where rice_fields.id = field_notes.field_id
        and rice_fields.farmer_id = auth.uid()
      )
    )
  );

drop policy if exists "Farmers can insert notes on own fields" on field_notes;
create policy "Farmers can insert notes on own fields" on field_notes
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from rice_fields
      where rice_fields.id = field_notes.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

-- ============================================================
-- 0007_phase5_lgu.sql
-- ============================================================
-- AgriVista Phase 5: LGU oversight — verification columns + role-wide RLS.

alter table rice_fields
  add column if not exists is_verified boolean not null default false,
  add column if not exists verified_by uuid references profiles (id),
  add column if not exists verified_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- Helper: is the current user LGU staff?
create or replace function public.is_lgu_staff()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'lgu_staff'
  );
$$ language sql stable security definer;

drop policy if exists "LGU staff can view all fields" on rice_fields;
create policy "LGU staff can view all fields" on rice_fields
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can update any field" on rice_fields;
create policy "LGU staff can update any field" on rice_fields
  for update using (public.is_lgu_staff());

drop policy if exists "LGU staff can view all media" on field_media;
create policy "LGU staff can view all media" on field_media
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can insert media on any field" on field_media;
create policy "LGU staff can insert media on any field" on field_media
  for insert with check (public.is_lgu_staff());

drop policy if exists "LGU staff can view all notes" on field_notes;
create policy "LGU staff can view all notes" on field_notes
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can insert notes on any field" on field_notes;
create policy "LGU staff can insert notes on any field" on field_notes
  for insert with check (public.is_lgu_staff() and auth.uid() = author_id);

drop policy if exists "LGU staff can view all crop cycles" on crop_cycles;
create policy "LGU staff can view all crop cycles" on crop_cycles
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can view all observations" on crop_observations;
create policy "LGU staff can view all observations" on crop_observations
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can view all profiles" on profiles;
create policy "LGU staff can view all profiles" on profiles
  for select using (public.is_lgu_staff());

-- ============================================================
-- 0008_phase7_notifications.sql
-- ============================================================
-- AgriVista Phase 7: in-app notifications.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info', 'warning', 'success', 'reminder')),
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

drop policy if exists "Users can view own notifications" on notifications;
create policy "Users can view own notifications" on notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications
  for update using (auth.uid() = user_id);

drop policy if exists "LGU staff or self can insert notifications" on notifications;
create policy "LGU staff or self can insert notifications" on notifications
  for insert with check (public.is_lgu_staff() or auth.uid() = user_id);

-- ============================================================
-- 0009_phase8_admin.sql
-- ============================================================
-- AgriVista Phase 8: activity log, user management, system settings.

alter table profiles
  add column if not exists is_active boolean not null default true;

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id),
  action text not null,
  resource_type text,
  resource_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);

alter table activity_logs enable row level security;
alter table system_settings enable row level security;

drop policy if exists "Users can insert own activity logs" on activity_logs;
create policy "Users can insert own activity logs" on activity_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "LGU staff can view activity logs" on activity_logs;
create policy "LGU staff can view activity logs" on activity_logs
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can view settings" on system_settings;
create policy "LGU staff can view settings" on system_settings
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can update settings" on system_settings;
create policy "LGU staff can update settings" on system_settings
  for update using (public.is_lgu_staff());

drop policy if exists "LGU staff can insert settings" on system_settings;
create policy "LGU staff can insert settings" on system_settings
  for insert with check (public.is_lgu_staff());

drop policy if exists "LGU staff can update profiles" on profiles;
create policy "LGU staff can update profiles" on profiles
  for update using (public.is_lgu_staff());

insert into system_settings (key, value, description)
values
  ('max_upload_mb', '10', 'Maximum file upload size in megabytes'),
  ('map_default_center', '{"lat": 7.1667, "lng": 126.55}', 'Default map center (Banaybanay)')
on conflict (key) do nothing;

-- ============================================================
-- 0010_phase9_public.sql
-- ============================================================
-- AgriVista Phase 9: public aggregated stats (no individual records exposed).

create or replace function public.get_public_field_stats()
returns table (barangay text, field_status text, field_count bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(barangay, 'Unspecified') as barangay, field_status, count(*) as field_count
  from rice_fields
  group by barangay, field_status;
$$;

grant execute on function public.get_public_field_stats() to anon, authenticated;

-- ============================================================
-- 0011_security_fixes.sql
-- ============================================================
-- AgriVista security fixes.
--
-- Issues found and fixed:
-- 1. CRITICAL: Any authenticated user could PATCH their own `profiles` row and set
--    role='lgu_staff' or is_active=true directly via the Supabase REST API — RLS only
--    checked row ownership (auth.uid() = id), not which columns were being changed.
--    This granted full LGU admin power (view all farmers, verify/edit any field,
--    disable other accounts, edit system settings) to anyone with an account.
-- 2. CRITICAL: New LGU-staff signups were trusted immediately with no approval step,
--    even though the original design called for admin approval before LGU access.
-- 3. HIGH: A farmer could PATCH their own field's is_verified/verified_by/verified_at
--    to forge LGU verification, since the update policy only checked field ownership,
--    not which columns changed.
-- 4. MEDIUM: The "LGU staff can update any field" policy had no restriction preventing
--    farmer_id from being changed, i.e. an LGU account could reassign a field to a
--    different owner.
-- 5. MEDIUM: field_status_logs.changed_by and crop_observations.observed_by were
--    trusted from the client instead of being pinned to the actual caller, so a user
--    could forge who made a status change or observation.
-- 6. MEDIUM: The public "media" storage bucket had an explicit SELECT policy on
--    storage.objects that (beyond just permitting reads, already implied by the
--    bucket's public flag) also allowed listing/enumerating every file in the bucket.
--    The upload policy also let any authenticated user upload into ANY field's path,
--    not just their own.
-- 7. LOW: SECURITY DEFINER functions (is_lgu_staff, handle_new_user) didn't pin
--    search_path, which is a known Postgres privilege-escalation vector if a caller
--    can influence their session's search_path.

-- ---------------------------------------------------------------------------
-- Fix 7: pin search_path on existing SECURITY DEFINER functions.
-- ---------------------------------------------------------------------------
alter function public.is_lgu_staff() set search_path = public;
alter function public.handle_new_user() set search_path = public;

-- ---------------------------------------------------------------------------
-- Fix 2: new LGU-staff signups start inactive (pending approval by an existing
-- LGU staff member via the Users admin page). Farmers stay active immediately.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, barangay, is_active)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'farmer'),
    new.raw_user_meta_data ->> 'barangay',
    coalesce(new.raw_user_meta_data ->> 'role', 'farmer') != 'lgu_staff'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Fix 1: prevent a user from changing their own role/is_active/email, even
-- though they're allowed to update their own profile row otherwise. LGU staff
-- updating a DIFFERENT user's row (via the admin policy) is unaffected.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_privileges()
returns trigger as $$
begin
  if auth.uid() = new.id then
    new.role := old.role;
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_privileges on profiles;
create trigger protect_profile_privileges
  before update on profiles
  for each row execute procedure public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- Fix 3 & 4: prevent farmers from forging their own field's verification, and
-- prevent anyone from reassigning a field's owner via update.
-- ---------------------------------------------------------------------------
create or replace function public.protect_field_verification()
returns trigger as $$
begin
  if not public.is_lgu_staff() then
    new.is_verified := old.is_verified;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
  end if;
  new.farmer_id := old.farmer_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_field_verification on rice_fields;
create trigger protect_field_verification
  before update on rice_fields
  for each row execute procedure public.protect_field_verification();

-- ---------------------------------------------------------------------------
-- Fix 5: pin audit-trail authorship to the actual caller.
-- ---------------------------------------------------------------------------
drop policy if exists "Farmers can insert status logs for own fields" on field_status_logs;
create policy "Farmers can insert status logs for own fields" on field_status_logs
  for insert with check (
    changed_by = auth.uid()
    and exists (
      select 1 from rice_fields
      where rice_fields.id = field_status_logs.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "Farmers can insert observations for own cycles" on crop_observations;
create policy "Farmers can insert observations for own cycles" on crop_observations
  for insert with check (
    observed_by = auth.uid()
    and exists (
      select 1 from crop_cycles
      join rice_fields on rice_fields.id = crop_cycles.field_id
      where crop_cycles.id = crop_observations.cycle_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Fix 6: tighten storage.objects policies on the 'media' bucket.
-- ---------------------------------------------------------------------------
drop policy if exists "Public can view media" on storage.objects;
-- No replacement needed: the bucket's own `public = true` flag already allows
-- anonymous reads of an exact known object path. The dropped policy additionally
-- allowed listing/enumerating every file in the bucket, which nothing requires.

drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Field owners and LGU can upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (
      public.is_lgu_staff()
      or exists (
        select 1 from rice_fields
        where id::text = (storage.foldername(name))[1]
        and farmer_id = auth.uid()
      )
      or (
        (storage.foldername(name))[1] = 'observations'
        and exists (
          select 1 from crop_cycles
          join rice_fields on rice_fields.id = crop_cycles.field_id
          where crop_cycles.id::text = (storage.foldername(name))[2]
          and rice_fields.farmer_id = auth.uid()
        )
      )
    )
  );

-- ============================================================
-- 0012_caganganan_purok_scope.sql
-- ============================================================
-- Narrows scope to Barangay Caganganan (per the capstone proposal) and adds
-- Purok as the meaningful sub-location, replacing barangay for filtering/charts
-- now that barangay itself is fixed. Existing rows are left as-is; only new
-- registrations/fields get the Caganganan default and a purok.

alter table profiles
  add column if not exists purok text;
alter table profiles
  alter column barangay set default 'Caganganan';

alter table profiles
  drop constraint if exists profiles_purok_check;
alter table profiles
  add constraint profiles_purok_check
  check (
    purok is null or purok in (
      'Purok Malinawon',
      'Purok Malipayon',
      'Purok San Francisco',
      'Purok Anahaw',
      'Purok Rose Mabuhay',
      'Purok Liko Liko',
      'Purok Awa-aw'
    )
  );

alter table rice_fields
  add column if not exists purok text;
alter table rice_fields
  alter column barangay set default 'Caganganan';

alter table rice_fields
  drop constraint if exists rice_fields_purok_check;
alter table rice_fields
  add constraint rice_fields_purok_check
  check (
    purok is null or purok in (
      'Purok Malinawon',
      'Purok Malipayon',
      'Purok San Francisco',
      'Purok Anahaw',
      'Purok Rose Mabuhay',
      'Purok Liko Liko',
      'Purok Awa-aw'
    )
  );

-- Registration now collects purok instead of barangay (barangay defaults to
-- Caganganan for everyone).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, barangay, purok, is_active)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'farmer'),
    coalesce(new.raw_user_meta_data ->> 'barangay', 'Caganganan'),
    new.raw_user_meta_data ->> 'purok',
    coalesce(new.raw_user_meta_data ->> 'role', 'farmer') != 'lgu_staff'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Public aggregate stats now break down by purok within Caganganan.
-- (dropped first: the return column set is changing from barangay to purok,
-- which CREATE OR REPLACE cannot do in place)
drop function if exists public.get_public_field_stats();
create function public.get_public_field_stats()
returns table (purok text, field_status text, field_count bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(purok, 'Unspecified') as purok, field_status, count(*) as field_count
  from rice_fields
  group by purok, field_status;
$$;

-- ============================================================
-- 0013_drone_media_type.sql
-- ============================================================
-- Adds a distinct 'drone_photo' media type for aerial/drone field shots,
-- so they can be labeled and shown differently from ground-level photos.

alter table field_media
  drop constraint if exists field_media_media_type_check;
alter table field_media
  add constraint field_media_media_type_check
  check (media_type in ('photo', 'panorama_360', 'video', 'drone_photo'));

-- ============================================================
-- 0014_announcements_and_reports.sql
-- ============================================================
-- Adds LGU announcements (broadcast notifications) and farmer-submitted
-- monitoring reports that LGU can review, per the capstone proposal's
-- functional requirements.

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_purok text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

drop policy if exists "LGU staff can view announcements" on announcements;
create policy "LGU staff can view announcements" on announcements
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can create announcements" on announcements;
create policy "LGU staff can create announcements" on announcements
  for insert with check (public.is_lgu_staff() and created_by = auth.uid());

create table if not exists field_reports (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references rice_fields (id) on delete cascade,
  submitted_by uuid not null references profiles (id),
  summary text not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table field_reports enable row level security;

drop policy if exists "Farmers can view own field reports" on field_reports;
create policy "Farmers can view own field reports" on field_reports
  for select using (
    exists (
      select 1 from rice_fields
      where rice_fields.id = field_reports.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "Farmers can submit reports for own fields" on field_reports;
create policy "Farmers can submit reports for own fields" on field_reports
  for insert with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from rice_fields
      where rice_fields.id = field_reports.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );

drop policy if exists "LGU staff can view all field reports" on field_reports;
create policy "LGU staff can view all field reports" on field_reports
  for select using (public.is_lgu_staff());

drop policy if exists "LGU staff can review field reports" on field_reports;
create policy "LGU staff can review field reports" on field_reports
  for update using (public.is_lgu_staff());

-- ============================================================
-- 0015_media_field_condition.sql
-- ============================================================
-- Adds a field-condition tag for 360° multimedia, matching the proposal's
-- categorization: unplanted, planted, growth status, ready-to-harvest.

alter table field_media
  add column if not exists field_condition text;

alter table field_media
  drop constraint if exists field_media_field_condition_check;
alter table field_media
  add constraint field_media_field_condition_check
  check (
    field_condition is null or field_condition in (
      'unplanted', 'planted', 'growth_status', 'ready_to_harvest'
    )
  );

-- ============================================================
-- 0016_admin_role.sql
-- ============================================================
-- Adds an 'admin' role that approves LGU staff registrations (with email
-- confirmation visibility), separate from LGU staff's own permissions.
-- Admin accounts are never self-registered — create one by signing up
-- normally (or via Supabase Auth directly) and manually setting
-- profiles.role = 'admin' and is_active = true in the Table Editor/SQL Editor.

alter table profiles
  drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('farmer', 'lgu_staff', 'admin'));

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Narrow LGU staff's profile-update power to farmer accounts only; admin
-- gets full update rights (needed to approve/manage LGU accounts).
-- ---------------------------------------------------------------------------
drop policy if exists "LGU staff can update profiles" on profiles;
create policy "LGU staff can update farmer profiles" on profiles
  for update using (public.is_lgu_staff() and role = 'farmer');

drop policy if exists "Admin can update any profile" on profiles;
create policy "Admin can update any profile" on profiles
  for update using (public.is_admin());

drop policy if exists "Admin can view all profiles" on profiles;
create policy "Admin can view all profiles" on profiles
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin-only: list LGU staff accounts with their email-confirmation status
-- (auth.users isn't otherwise readable via the client).
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_lgu_accounts()
returns table (
  id uuid,
  full_name text,
  email text,
  purok text,
  is_active boolean,
  email_confirmed boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select p.id, p.full_name, p.email, p.purok, p.is_active,
           (u.email_confirmed_at is not null) as email_confirmed,
           p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    where p.role = 'lgu_staff'
    order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_lgu_accounts() to authenticated;

-- ============================================================
-- 0017_farmer_field_details.sql
-- ============================================================
-- Farmer field registration: ownership, maintenance, and seed type.
-- Area, planting date, estimated harvest, and crop status use the columns
-- added in 0003_phase1_fields.sql.

alter table rice_fields
  add column if not exists owner_name text,
  add column if not exists maintainer_name text,
  add column if not exists seed_type text;

alter table rice_fields
  drop constraint if exists rice_fields_seed_type_check;
alter table rice_fields
  add constraint rice_fields_seed_type_check
  check (seed_type in ('inbred', 'hybrid'));

-- ============================================================
-- 0018_field_approval.sql
-- ============================================================
-- New fields and changes to field information require LGU approval before
-- contributing to Community. Reuse the existing verification columns.

create or replace function public.protect_field_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- An INSERT must never be able to bypass the review step.
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.updated_at := clock_timestamp();
    return new;
  end if;

  -- Keep the registered farmer immutable, as in migration 0011.
  new.farmer_id := old.farmer_id;

  -- Any actual change to field information invalidates the previous review,
  -- including a change submitted together with an approval flag.
  if (to_jsonb(new) - array['is_verified', 'verified_by', 'verified_at', 'updated_at'])
      is distinct from
     (to_jsonb(old) - array['is_verified', 'verified_by', 'verified_at', 'updated_at']) then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
  elsif exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'lgu_staff' and is_active = true
  ) then
    if new.is_verified and not old.is_verified then
      -- Stamp approval on the server, never trust client attribution or time.
      new.verified_by := auth.uid();
      new.verified_at := clock_timestamp();
    elsif not new.is_verified then
      new.verified_by := null;
      new.verified_at := null;
    else
      new.verified_by := old.verified_by;
      new.verified_at := old.verified_at;
    end if;
  else
    -- Farmers and inactive staff cannot change approval metadata.
    new.is_verified := old.is_verified;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
  end if;

  -- Used by the approval UI to reject a review of an outdated field version.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists protect_field_verification on public.rice_fields;
create trigger protect_field_verification
  before insert or update on public.rice_fields
  for each row execute function public.protect_field_verification();

create or replace function public.get_public_field_stats()
returns table (purok text, field_status text, field_count bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(purok, 'Unspecified') as purok, field_status, count(*) as field_count
  from public.rice_fields
  where is_verified = true
  group by purok, field_status;
$$;

revoke all on function public.get_public_field_stats() from public;
grant execute on function public.get_public_field_stats() to anon, authenticated;

-- ============================================================
-- 0019_field_review_outcomes.sql
-- ============================================================
-- LGU staff can reject a pending field or ask the farmer for corrections.
-- is_verified stays the single source of truth for Community visibility;
-- review_status/review_note only describe the outcome of a pending review.

alter table public.rice_fields
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'needs_correction', 'rejected')),
  add column if not exists review_note text;

create or replace function public.protect_field_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- An INSERT must never be able to bypass the review step.
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.review_status := 'pending';
    new.review_note := null;
    new.updated_at := clock_timestamp();
    return new;
  end if;

  -- Keep the registered farmer immutable, as in migration 0011.
  new.farmer_id := old.farmer_id;

  -- Any actual change to field information invalidates the previous review
  -- and sends the field back to the review queue (a resubmission).
  if (to_jsonb(new) - array['is_verified', 'verified_by', 'verified_at', 'updated_at', 'review_status', 'review_note'])
      is distinct from
     (to_jsonb(old) - array['is_verified', 'verified_by', 'verified_at', 'updated_at', 'review_status', 'review_note']) then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.review_status := 'pending';
    new.review_note := null;
  elsif exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'lgu_staff' and is_active = true
  ) then
    if new.is_verified and not old.is_verified then
      -- Stamp approval on the server, never trust client attribution or time.
      new.verified_by := auth.uid();
      new.verified_at := clock_timestamp();
      new.review_status := 'pending';
      new.review_note := null;
    elsif not new.is_verified then
      new.verified_by := null;
      new.verified_at := null;
      -- A correction request or rejection must explain itself to the farmer.
      if new.review_status <> 'pending' and nullif(btrim(coalesce(new.review_note, '')), '') is null then
        raise exception 'A note is required when rejecting a field or requesting corrections.';
      end if;
      if new.review_status = 'pending' then
        new.review_note := null;
      end if;
    else
      new.verified_by := old.verified_by;
      new.verified_at := old.verified_at;
      new.review_status := old.review_status;
      new.review_note := old.review_note;
    end if;
  else
    -- Farmers and inactive staff cannot change approval metadata.
    new.is_verified := old.is_verified;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
    new.review_status := old.review_status;
    new.review_note := old.review_note;
  end if;

  -- Used by the approval UI to reject a review of an outdated field version.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

-- ============================================================
-- 0020_review_notifications.sql
-- ============================================================
-- Notify LGU staff about work that needs them, and remind farmers about
-- upcoming harvests. Farmers cannot insert notifications for other users
-- (RLS), so these run as security-definer database functions.

create or replace function public.notify_lgu_staff(p_title text, p_message text, p_type text, p_link text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, title, message, type, link)
  select id, p_title, p_message, p_type, p_link
  from public.profiles
  where role = 'lgu_staff' and is_active = true;
$$;

revoke all on function public.notify_lgu_staff(text, text, text, text) from public;

create or replace function public.notify_field_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_lgu_staff(
      'New field registration',
      'Field "' || new.field_name || '" was registered and is waiting for verification.',
      'info', '/lgu/fields/' || new.id);
  elsif not new.is_verified and new.review_status = 'pending'
        and (old.is_verified or old.review_status <> 'pending') then
    perform public.notify_lgu_staff(
      'Field pending verification',
      'Field "' || new.field_name || '" was updated and needs another review.',
      'warning', '/lgu/fields/' || new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists notify_field_submitted on public.rice_fields;
create trigger notify_field_submitted
  after insert or update on public.rice_fields
  for each row execute function public.notify_field_submitted();

create or replace function public.notify_report_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_field_name text;
begin
  select field_name into v_field_name from public.rice_fields where id = new.field_id;
  perform public.notify_lgu_staff(
    'New monitoring report',
    'A monitoring report was submitted for "' || coalesce(v_field_name, 'a field') || '".',
    'info', '/lgu/fields/' || new.field_id);
  return null;
end;
$$;

drop trigger if exists notify_report_submitted on public.field_reports;
create trigger notify_report_submitted
  after insert on public.field_reports
  for each row execute function public.notify_report_submitted();

-- Called by the farmer's app on load; creates at most one reminder per field
-- every 14 days for harvests due within the next 14 days.
create or replace function public.create_harvest_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    return 0;
  end if;
  insert into public.notifications (user_id, title, message, type, link)
  select f.farmer_id, 'Harvest reminder',
    'Field "' || f.field_name || '" is expected to be ready for harvest on ' || f.expected_harvest || '.',
    'reminder', '/fields/' || f.id
  from public.rice_fields f
  where f.farmer_id = auth.uid()
    and f.expected_harvest between current_date and current_date + 14
    and not exists (
      select 1 from public.notifications n
      where n.user_id = f.farmer_id
        and n.type = 'reminder'
        and n.link = '/fields/' || f.id
        and n.created_at > now() - interval '14 days'
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.create_harvest_reminders() from public;
grant execute on function public.create_harvest_reminders() to authenticated;

-- ============================================================
-- 0021_public_fields_map.sql
-- ============================================================
-- Anonymised, LGU-approved field data for the public map. No ids, names,
-- owners or farmer references are returned, and coordinates are rounded to
-- three decimals (about 100 m) so a marker cannot pinpoint a farmer's land.

create or replace function public.get_public_fields()
returns table (
  purok text,
  field_status text,
  area_hectares numeric,
  crop_variety text,
  seed_type text,
  irrigation_type text,
  expected_harvest_month text,
  latitude numeric,
  longitude numeric
)
language sql
security definer
set search_path = public
as $$
  select coalesce(purok, 'Unspecified'),
         field_status,
         area_hectares,
         crop_variety,
         seed_type,
         irrigation_type,
         to_char(expected_harvest, 'YYYY-MM'),
         round(latitude::numeric, 3),
         round(longitude::numeric, 3)
  from public.rice_fields
  where is_verified = true;
$$;

revoke all on function public.get_public_fields() from public;
grant execute on function public.get_public_fields() to anon, authenticated;

-- ============================================================
-- 0022_report_details.sql
-- ============================================================
-- Monitoring reports gain structured details. `summary` remains the
-- free-text observation, so existing reports keep working unchanged.

alter table public.field_reports
  add column if not exists report_date date,
  add column if not exists crop_status text
    check (crop_status in ('fallow', 'land_prep', 'planted', 'growing', 'harvested')),
  add column if not exists field_condition text
    check (field_condition in ('healthy', 'pest_affected', 'diseased', 'drought_stressed')),
  add column if not exists harvest_info text,
  add column if not exists photo_url text;

-- ============================================================
-- 0023_user_deletion.sql
-- ============================================================
-- Allow deleting a user. Records that merely mention who did something
-- (activity log, status history, notes, approvals, ...) are kept and the
-- reference is cleared; the user's own fields, notifications and profile are
-- still removed by the existing ON DELETE CASCADE rules.

do $$
declare
  target record;
  fk record;
begin
  for target in
    select * from (values
      ('activity_logs', 'user_id'),
      ('system_settings', 'updated_by'),
      ('rice_fields', 'verified_by'),
      ('field_media', 'uploaded_by'),
      ('field_reports', 'reviewed_by'),
      ('field_reports', 'submitted_by'),
      ('field_status_logs', 'changed_by'),
      ('crop_observations', 'observed_by'),
      ('field_notes', 'author_id'),
      ('announcements', 'created_by')
    ) as t (table_name, column_name)
  loop
    -- Find and drop the existing foreign key from this column to profiles.
    for fk in
      select con.conname
      from pg_constraint con
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
      where con.contype = 'f'
        and con.conrelid = format('public.%I', target.table_name)::regclass
        and con.confrelid = 'public.profiles'::regclass
        and att.attname = target.column_name
    loop
      execute format('alter table public.%I drop constraint %I', target.table_name, fk.conname);
    end loop;

    execute format('alter table public.%I alter column %I drop not null', target.table_name, target.column_name);
    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references public.profiles (id) on delete set null',
      target.table_name, target.table_name || '_' || target.column_name || '_fkey', target.column_name);
  end loop;
end;
$$;

-- Let the approval trigger accept the cleared approver (see above).
create or replace function public.protect_field_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- An INSERT must never be able to bypass the review step.
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.review_status := 'pending';
    new.review_note := null;
    new.updated_at := clock_timestamp();
    return new;
  end if;

  -- Keep the registered farmer immutable, as in migration 0011.
  new.farmer_id := old.farmer_id;

  -- Any actual change to field information invalidates the previous review
  -- and sends the field back to the review queue (a resubmission).
  if (to_jsonb(new) - array['is_verified', 'verified_by', 'verified_at', 'updated_at', 'review_status', 'review_note'])
      is distinct from
     (to_jsonb(old) - array['is_verified', 'verified_by', 'verified_at', 'updated_at', 'review_status', 'review_note']) then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.review_status := 'pending';
    new.review_note := null;
  elsif exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'lgu_staff' and is_active = true
  ) then
    if new.is_verified and not old.is_verified then
      -- Stamp approval on the server, never trust client attribution or time.
      new.verified_by := auth.uid();
      new.verified_at := clock_timestamp();
      new.review_status := 'pending';
      new.review_note := null;
    elsif not new.is_verified then
      new.verified_by := null;
      new.verified_at := null;
      -- A correction request or rejection must explain itself to the farmer.
      if new.review_status <> 'pending' and nullif(btrim(coalesce(new.review_note, '')), '') is null then
        raise exception 'A note is required when rejecting a field or requesting corrections.';
      end if;
      if new.review_status = 'pending' then
        new.review_note := null;
      end if;
    else
      new.verified_by := old.verified_by;
      new.verified_at := old.verified_at;
      new.review_status := old.review_status;
      new.review_note := old.review_note;
    end if;
  else
    -- Farmers and inactive staff cannot change approval metadata. The one
    -- exception is clearing the approver when that account has been deleted.
    new.is_verified := old.is_verified;
    if new.verified_by is null and old.verified_by is not null
       and not exists (select 1 from public.profiles where id = old.verified_by) then
      new.verified_by := null;
    else
      new.verified_by := old.verified_by;
    end if;
    new.verified_at := old.verified_at;
    new.review_status := old.review_status;
    new.review_note := old.review_note;
  end if;

  -- Used by the approval UI to reject a review of an outdated field version.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

-- ============================================================
-- 0024_admin_manage_users.sql
-- ============================================================
-- Admin-only user management across every role: list all accounts and
-- permanently delete one. Deleting goes through auth.users (the profile and
-- the user's own data follow via ON DELETE CASCADE; history is kept, see 0023).

create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  purok text,
  is_active boolean,
  email_confirmed boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select p.id, p.full_name, p.email, p.role, p.purok, p.is_active,
           (u.email_confirmed_at is not null), p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;
  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'User not found.';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ============================================================
-- 0025_remove_unused_settings.sql
-- ============================================================
-- These settings were never read by the app, so remove them from system_settings.
delete from public.system_settings
where key in ('max_upload_mb', 'map_default_center');
