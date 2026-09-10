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
