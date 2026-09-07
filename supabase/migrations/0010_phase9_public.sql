-- AgriVista Phase 9: public aggregated stats (no individual records exposed).

create or replace function public.get_public_field_stats()
returns table (barangay text, field_status text, field_count bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(barangay, 'Unspecified') as barangay, field_status, count(*) as field_count
  from rice_fields
  group by barangay, field_status;
$$;

grant execute on function public.get_public_field_stats() to anon, authenticated;
