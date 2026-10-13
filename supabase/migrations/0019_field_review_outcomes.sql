-- LGU staff can reject a pending field or ask the farmer for corrections.
-- is_verified stays the single source of truth for Community visibility;
-- review_status/review_note only describe the outcome of a pending review.

alter table public.rice_fields
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'needs_correction', 'rejected')),
  add column if not exists review_note text;

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
    -- Farmers and inactive staff cannot change approval metadata.
    new.is_verified := old.is_verified;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
    new.review_status := old.review_status;
    new.review_note := old.review_note;
  end if;

  -- Used by the approval UI to reject a review of an outdated field version.
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
