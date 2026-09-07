-- AgriVista Phase 7: in-app notifications.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info', 'warning', 'success', 'reminder')),
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

drop policy if exists "Users can view own notifications" on notifications;
create policy "Users can view own notifications" on notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications
  for update using (auth.uid() = user_id);

drop policy if exists "LGU staff or self can insert notifications" on notifications;
create policy "LGU staff or self can insert notifications" on notifications
  for insert with check (public.is_lgu_staff() or auth.uid() = user_id);
