-- New fields and changes to field information require LGU approval before
-- contributing to Community. Reuse the existing verification columns.

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
    new.updated_at := clock_timestamp();
    return new;
  end if;

  -- Keep the registered farmer immutable, as in migration 0011.
  new.farmer_id := old.farmer_id;

  -- Any actual change to field information invalidates the previous review,
  -- including a change submitted together with an approval flag.
  if (to_jsonb(new) - array['is_verified', 'verified_by', 'verified_at', 'updated_at'])
      is distinct from
     (to_jsonb(old) - array['is_verified', 'verified_by', 'verified_at', 'updated_at']) then
    new.is_verified := false;
    new.verified_by := null;
    new.verified_at := null;
  elsif exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'lgu_staff' and is_active = true
  ) then
    if new.is_verified and not old.is_verified then
      -- Stamp approval on the server, never trust client attribution or time.
      new.verified_by := auth.uid();
      new.verified_at := clock_timestamp();
    elsif not new.is_verified then
      new.verified_by := null;
      new.verified_at := null;
    else
      new.verified_by := old.verified_by;
      new.verified_at := old.verified_at;
    end if;
  else
    -- Farmers and inactive staff cannot change approval metadata.
    new.is_verified := old.is_verified;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
  end if;

  -- Used by the approval UI to reject a review of an outdated field version.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists protect_field_verification on public.rice_fields;
create trigger protect_field_verification
  before insert or update on public.rice_fields
  for each row execute function public.protect_field_verification();

create or replace function public.get_public_field_stats()
returns table (purok text, field_status text, field_count bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(purok, 'Unspecified') as purok, field_status, count(*) as field_count
  from public.rice_fields
  where is_verified = true
  group by purok, field_status;
$$;

revoke all on function public.get_public_field_stats() from public;
grant execute on function public.get_public_field_stats() to anon, authenticated;
