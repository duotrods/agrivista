-- Notify LGU staff about work that needs them, and remind farmers about
-- upcoming harvests. Farmers cannot insert notifications for other users
-- (RLS), so these run as security-definer database functions.

create or replace function public.notify_lgu_staff(p_title text, p_message text, p_type text, p_link text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, title, message, type, link)
  select id, p_title, p_message, p_type, p_link
  from public.profiles
  where role = 'lgu_staff' and is_active = true;
$$;

revoke all on function public.notify_lgu_staff(text, text, text, text) from public;

create or replace function public.notify_field_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_lgu_staff(
      'New field registration',
      'Field "' || new.field_name || '" was registered and is waiting for verification.',
      'info', '/lgu/fields/' || new.id);
  elsif not new.is_verified and new.review_status = 'pending'
        and (old.is_verified or old.review_status <> 'pending') then
    perform public.notify_lgu_staff(
      'Field pending verification',
      'Field "' || new.field_name || '" was updated and needs another review.',
      'warning', '/lgu/fields/' || new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists notify_field_submitted on public.rice_fields;
create trigger notify_field_submitted
  after insert or update on public.rice_fields
  for each row execute function public.notify_field_submitted();

create or replace function public.notify_report_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_field_name text;
begin
  select field_name into v_field_name from public.rice_fields where id = new.field_id;
  perform public.notify_lgu_staff(
    'New monitoring report',
    'A monitoring report was submitted for "' || coalesce(v_field_name, 'a field') || '".',
    'info', '/lgu/fields/' || new.field_id);
  return null;
end;
$$;

drop trigger if exists notify_report_submitted on public.field_reports;
create trigger notify_report_submitted
  after insert on public.field_reports
  for each row execute function public.notify_report_submitted();

-- Called by the farmer's app on load; creates at most one reminder per field
-- every 14 days for harvests due within the next 14 days.
create or replace function public.create_harvest_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    return 0;
  end if;
  insert into public.notifications (user_id, title, message, type, link)
  select f.farmer_id, 'Harvest reminder',
    'Field "' || f.field_name || '" is expected to be ready for harvest on ' || f.expected_harvest || '.',
    'reminder', '/fields/' || f.id
  from public.rice_fields f
  where f.farmer_id = auth.uid()
    and f.expected_harvest between current_date and current_date + 14
    and not exists (
      select 1 from public.notifications n
      where n.user_id = f.farmer_id
        and n.type = 'reminder'
        and n.link = '/fields/' || f.id
        and n.created_at > now() - interval '14 days'
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.create_harvest_reminders() from public;
grant execute on function public.create_harvest_reminders() to authenticated;
