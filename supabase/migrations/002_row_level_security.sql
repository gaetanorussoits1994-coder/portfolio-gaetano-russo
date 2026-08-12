alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_items enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists "admin can read own authorization" on public.admin_users;
create policy "admin can read own authorization" on public.admin_users for select
to authenticated using (
  user_id = auth.uid()
  and is_active = true
  and public.is_portfolio_admin()
);
drop policy if exists "admins manage authorization" on public.admin_users;

drop policy if exists "public reads public settings" on public.site_settings;
create policy "public reads public settings" on public.site_settings for select
to anon, authenticated using (is_public = true or public.is_portfolio_admin());
drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings" on public.site_settings for all
to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());

drop policy if exists "public reads published content" on public.content_items;
create policy "public reads published content" on public.content_items for select
to anon, authenticated using (status = 'published' or public.is_portfolio_admin());
drop policy if exists "admins create content" on public.content_items;
create policy "admins create content" on public.content_items for insert
to authenticated with check (public.is_portfolio_admin());
drop policy if exists "admins update content" on public.content_items;
create policy "admins update content" on public.content_items for update
to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists "admins delete content" on public.content_items;
create policy "admins delete content" on public.content_items for delete
to authenticated using (public.is_portfolio_admin());

drop policy if exists "public reads published media metadata" on public.media_assets;
create policy "public reads published media metadata" on public.media_assets for select
to anon, authenticated using (status = 'published' or public.is_portfolio_admin());
drop policy if exists "admins create media metadata" on public.media_assets;
create policy "admins create media metadata" on public.media_assets for insert
to authenticated with check (public.is_portfolio_admin());
drop policy if exists "admins update media metadata" on public.media_assets;
create policy "admins update media metadata" on public.media_assets for update
to authenticated using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists "admins delete media metadata" on public.media_assets;
create policy "admins delete media metadata" on public.media_assets for delete
to authenticated using (public.is_portfolio_admin());

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.content_items from anon, authenticated;
revoke all on table public.media_assets from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.content_items, public.site_settings, public.media_assets to anon;
grant select, insert, update, delete on public.content_items, public.site_settings, public.media_assets to authenticated;
grant select on public.admin_users to authenticated;
