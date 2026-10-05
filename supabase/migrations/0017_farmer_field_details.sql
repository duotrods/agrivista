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
