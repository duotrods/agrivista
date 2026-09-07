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
