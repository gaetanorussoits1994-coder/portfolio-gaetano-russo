-- Remove email-based authorization from the already-deployed database.
-- Apply manually after 005_media_messages_and_replies.sql.

begin;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users as administrator
    where administrator.user_id = auth.uid()
      and administrator.is_active = true
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

-- This helper remains executable only by privileged database roles. Removing
-- its email allow-list keeps personal addresses out of versioned SQL without
-- allowing browser clients to grant administrative access.
create or replace function public.grant_portfolio_admin(target_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare target_id uuid;
begin
  select id into target_id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;
  if target_id is null then raise exception 'Auth user not found'; end if;
  insert into public.admin_users (user_id, is_active) values (target_id, true)
  on conflict (user_id) do update set is_active = true, updated_at = now();
  return target_id;
end;
$$;

revoke all on function public.grant_portfolio_admin(text) from public, anon, authenticated;
grant execute on function public.grant_portfolio_admin(text) to postgres, service_role;

commit;
