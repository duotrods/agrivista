-- Admin-only user management across every role: list all accounts and
-- permanently delete one. Deleting goes through auth.users (the profile and
-- the user's own data follow via ON DELETE CASCADE; history is kept, see 0023).

create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
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
    select p.id, p.full_name, p.email, p.role, p.purok, p.is_active,
           (u.email_confirmed_at is not null), p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;
  if not exists (select 1 from profiles where id = p_user_id) then
    raise exception 'User not found.';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_list_users() from public;
revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
