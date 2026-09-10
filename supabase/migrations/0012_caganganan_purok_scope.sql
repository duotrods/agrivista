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
