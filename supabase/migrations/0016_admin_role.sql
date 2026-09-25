-- Adds an 'admin' role that approves LGU staff registrations (with email
-- confirmation visibility), separate from LGU staff's own permissions.
-- Admin accounts are never self-registered — create one by signing up
-- normally (or via Supabase Auth directly) and manually setting
-- profiles.role = 'admin' and is_active = true in the Table Editor/SQL Editor.

alter table profiles
  drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('farmer', 'lgu_staff', 'admin'));

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Narrow LGU staff's profile-update power to farmer accounts only; admin
-- gets full update rights (needed to approve/manage LGU accounts).
-- ---------------------------------------------------------------------------
drop policy if exists "LGU staff can update profiles" on profiles;
create policy "LGU staff can update farmer profiles" on profiles
  for update using (public.is_lgu_staff() and role = 'farmer');

drop policy if exists "Admin can update any profile" on profiles;
create policy "Admin can update any profile" on profiles
  for update using (public.is_admin());

drop policy if exists "Admin can view all profiles" on profiles;
create policy "Admin can view all profiles" on profiles
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin-only: list LGU staff accounts with their email-confirmation status
-- (auth.users isn't otherwise readable via the client).
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_lgu_accounts()
returns table (
  id uuid,
  full_name text,
  email text,
  purok text,
  is_active boolean,
  email_confirmed boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select p.id, p.full_name, p.email, p.purok, p.is_active,
           (u.email_confirmed_at is not null) as email_confirmed,
           p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    where p.role = 'lgu_staff'
    order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_lgu_accounts() to authenticated;
