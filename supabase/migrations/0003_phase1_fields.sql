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
