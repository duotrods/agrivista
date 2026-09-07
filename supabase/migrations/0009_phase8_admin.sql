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
