-- AgriVista: check that a Supabase project was set up correctly.
-- Run it in the Supabase SQL Editor after full-setup.sql. Every row should say OK.

with expected_tables(name) as (
  values ('profiles'), ('rice_fields'), ('field_media'), ('field_status_logs'), ('field_notes'),
         ('field_reports'), ('crop_cycles'), ('crop_observations'), ('notifications'),
         ('announcements'), ('activity_logs'), ('system_settings')
),
expected_functions(name) as (
  values ('handle_new_user'), ('protect_profile_privileges'), ('protect_field_verification'),
         ('notify_lgu_staff'), ('notify_field_submitted'), ('notify_report_submitted'),
         ('create_harvest_reminders'), ('is_lgu_staff'), ('is_admin'),
         ('get_public_field_stats'), ('get_public_fields'),
         ('admin_list_lgu_accounts'), ('admin_list_users'), ('admin_delete_user')
),
expected_triggers(name) as (
  values ('on_auth_user_created'), ('protect_profile_privileges'), ('protect_field_verification'),
         ('notify_field_submitted'), ('notify_report_submitted')
),
checks as (
  select 'table ' || name as check_name,
         exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = name) as ok
  from expected_tables
  union all
  select 'row level security on ' || name,
         coalesce((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
                   where n.nspname = 'public' and c.relname = name), false)
  from expected_tables
  union all
  select 'function ' || name,
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = name)
  from expected_functions
  union all
  select 'trigger ' || name,
         exists (select 1 from pg_trigger where tgname = name and not tgisinternal)
  from expected_triggers
  union all
  select 'storage bucket "media" exists and is public',
         exists (select 1 from storage.buckets where id = 'media' and public)
  union all
  select 'storage upload policy for field owners',
         exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
                 and policyname = 'Field owners and LGU can upload media')
  union all
  select 'unused settings removed (migration 0025)',
         not exists (select 1 from system_settings where key in ('max_upload_mb', 'map_default_center'))
)
select check_name, case when ok then 'OK' else 'MISSING' end as status
from checks
order by ok, check_name;
