-- Allow deleting a user. Records that merely mention who did something
-- (activity log, status history, notes, approvals, ...) are kept and the
-- reference is cleared; the user's own fields, notifications and profile are
-- still removed by the existing ON DELETE CASCADE rules.

do $$
declare
  target record;
  fk record;
begin
  for target in
    select * from (values
      ('activity_logs', 'user_id'),
      ('system_settings', 'updated_by'),
      ('rice_fields', 'verified_by'),
      ('field_media', 'uploaded_by'),
      ('field_reports', 'reviewed_by'),
      ('field_reports', 'submitted_by'),
      ('field_status_logs', 'changed_by'),
      ('crop_observations', 'observed_by'),
      ('field_notes', 'author_id'),
      ('announcements', 'created_by')
    ) as t (table_name, column_name)
  loop
    -- Find and drop the existing foreign key from this column to profiles.
    for fk in
      select con.conname
      from pg_constraint con
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
      where con.contype = 'f'
        and con.conrelid = format('public.%I', target.table_name)::regclass
        and con.confrelid = 'public.profiles'::regclass
        and att.attname = target.column_name
    loop
      execute format('alter table public.%I drop constraint %I', target.table_name, fk.conname);
    end loop;

    execute format('alter table public.%I alter column %I drop not null', target.table_name, target.column_name);
    execute format(
      'alter table public.%I add constraint %I foreign key (%I) references public.profiles (id) on delete set null',
      target.table_name, target.table_name || '_' || target.column_name || '_fkey', target.column_name);
  end loop;
end;
$$;

-- Let the approval trigger accept the cleared approver (see above).
create or replace function public.protect_field_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- An INSERT must never be able to bypass the review step.
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.review_status := 'pending';
    new.review_note := null;
    new.updated_at := clock_timestamp();
    return new;
  end if;

  -- Keep the registered farmer immutable, as in migration 0011.
  new.farmer_id := old.farmer_id;

  -- Any actual change to field information invalidates the previous review
  -- and sends the field back to the review queue (a resubmission).
  if (to_jsonb(new) - array['is_verified', 'verified_by', 'verified_at', 'updated_at', 'review_status', 'review_note'])
      is distinct from
     (to_jsonb(old) - array['is_verified', 'verified_by', 'verified_at', 'updated_at', 'review_status', 'review_note']) then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
    new.review_status := 'pending';
    new.review_note := null;
  elsif exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'lgu_staff' and is_active = true
  ) then
    if new.is_verified and not old.is_verified then
      -- Stamp approval on the server, never trust client attribution or time.
      new.verified_by := auth.uid();
      new.verified_at := clock_timestamp();
      new.review_status := 'pending';
      new.review_note := null;
    elsif not new.is_verified then
      new.verified_by := null;
      new.verified_at := null;
      -- A correction request or rejection must explain itself to the farmer.
      if new.review_status <> 'pending' and nullif(btrim(coalesce(new.review_note, '')), '') is null then
        raise exception 'A note is required when rejecting a field or requesting corrections.';
      end if;
      if new.review_status = 'pending' then
        new.review_note := null;
      end if;
    else
      new.verified_by := old.verified_by;
      new.verified_at := old.verified_at;
      new.review_status := old.review_status;
      new.review_note := old.review_note;
    end if;
  else
    -- Farmers and inactive staff cannot change approval metadata. The one
    -- exception is clearing the approver when that account has been deleted.
    new.is_verified := old.is_verified;
    if new.verified_by is null and old.verified_by is not null
       and not exists (select 1 from public.profiles where id = old.verified_by) then
      new.verified_by := null;
    else
      new.verified_by := old.verified_by;
    end if;
    new.verified_at := old.verified_at;
    new.review_status := old.review_status;
    new.review_note := old.review_note;
  end if;

  -- Used by the approval UI to reject a review of an outdated field version.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
