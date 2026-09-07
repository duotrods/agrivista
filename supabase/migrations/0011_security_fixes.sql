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
