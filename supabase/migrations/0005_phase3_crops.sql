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
