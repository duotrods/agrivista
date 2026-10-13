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
