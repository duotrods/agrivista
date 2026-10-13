-- Anonymised, LGU-approved field data for the public map. No ids, names,
-- owners or farmer references are returned, and coordinates are rounded to
-- three decimals (about 100 m) so a marker cannot pinpoint a farmer's land.

create or replace function public.get_public_fields()
returns table (
  purok text,
  field_status text,
  area_hectares numeric,
  crop_variety text,
  seed_type text,
  irrigation_type text,
  expected_harvest_month text,
  latitude numeric,
  longitude numeric
)
language sql
security definer
set search_path = public
as $$
  select coalesce(purok, 'Unspecified'),
         field_status,
         area_hectares,
         crop_variety,
         seed_type,
         irrigation_type,
         to_char(expected_harvest, 'YYYY-MM'),
         round(latitude::numeric, 3),
         round(longitude::numeric, 3)
  from public.rice_fields
  where is_verified = true;
$$;

revoke all on function public.get_public_fields() from public;
grant execute on function public.get_public_fields() to anon, authenticated;
