-- Media library, section placements, contact inbox and reply history.
-- Additive migration: run manually after 004_seed_current_content.sql.
-- This file also applies the security hardening added locally to migrations
-- 001-003 after those migrations had already been run remotely.

begin;

-- Bring security-definer and trigger functions from the already-applied 001
-- to their hardened definitions. All referenced objects exist after 001.
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

create or replace function public.set_portfolio_audit_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  if tg_op = 'INSERT' and new.created_by is null then new.created_by = auth.uid(); end if;
  return new;
end;
$$;

create or replace function public.set_site_settings_audit_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

revoke all on function public.set_portfolio_audit_fields() from public, anon, authenticated;
revoke all on function public.set_site_settings_audit_fields() from public, anon, authenticated;

-- Apply the authorization-policy and privilege hardening that exists only in
-- the edited local 002. Active-admin verification remains database-side.
drop policy if exists "admin can read own authorization" on public.admin_users;
create policy "admin can read own authorization" on public.admin_users for select
to authenticated using (
  user_id = auth.uid()
  and is_active = true
  and public.is_portfolio_admin()
);
drop policy if exists "admins manage authorization" on public.admin_users;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;
revoke all on table public.content_items from anon, authenticated;
revoke all on table public.media_assets from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.content_items, public.site_settings, public.media_assets to anon;
grant select, insert, update, delete on public.content_items, public.site_settings, public.media_assets to authenticated;
grant select on public.admin_users to authenticated;

alter table public.media_assets
  add column if not exists media_type text,
  add column if not exists title_internal text,
  add column if not exists caption text,
  add column if not exists external_url text,
  add column if not exists poster_media_id uuid references public.media_assets(id) on delete set null;

update public.media_assets
set media_type = case
      when mime_type like 'video/%' then 'video'
      when mime_type = 'application/pdf' then 'document'
      else 'image'
    end,
    title_internal = coalesce(nullif(title_internal, ''), original_name)
where media_type is null or title_internal is null or title_internal = '';

alter table public.media_assets alter column media_type set default 'image';
alter table public.media_assets alter column media_type set not null;
alter table public.media_assets alter column title_internal set default '';
alter table public.media_assets alter column title_internal set not null;
alter table public.media_assets drop constraint if exists media_assets_media_type_check;
alter table public.media_assets add constraint media_assets_media_type_check check (media_type in ('image','video','document'));
alter table public.media_assets drop constraint if exists media_assets_title_internal_check;
alter table public.media_assets add constraint media_assets_title_internal_check check (length(title_internal) between 1 and 180);
alter table public.media_assets drop constraint if exists media_assets_caption_check;
alter table public.media_assets add constraint media_assets_caption_check check (caption is null or length(caption) <= 500);
alter table public.media_assets drop constraint if exists media_assets_mime_type_check;
alter table public.media_assets add constraint media_assets_mime_type_check check (
  mime_type in ('image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm')
);
alter table public.media_assets drop constraint if exists media_assets_size_bytes_check;
alter table public.media_assets add constraint media_assets_size_bytes_check check (
  size_bytes > 0 and size_bytes <= case when media_type = 'video' then 104857600 else 12582912 end
);
alter table public.media_assets drop constraint if exists media_assets_external_url_check;
alter table public.media_assets add constraint media_assets_external_url_check check (
  external_url is null or external_url ~ '^https://'
);
alter table public.media_assets drop constraint if exists media_assets_poster_not_self_check;
alter table public.media_assets add constraint media_assets_poster_not_self_check check (poster_media_id is null or poster_media_id <> id);

create table if not exists public.media_placements (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_assets(id) on delete restrict,
  section_key text not null check (section_key in ('hero','profile','infrastructure_case','web_project','skill','technical_lab','experience','certificate','contact_copy','contact_link','seo','section')),
  content_item_id uuid references public.content_items(id) on delete cascade,
  sort_order integer not null default 0 check (sort_order between -10000 and 10000),
  is_visible boolean not null default false,
  aspect_ratio text not null default 'auto' check (aspect_ratio in ('auto','1/1','4/3','3/2','16/9','9/16','21/9')),
  fit text not null default 'cover' check (fit in ('cover','contain','natural')),
  position_x smallint not null default 50 check (position_x between 0 and 100),
  position_y smallint not null default 50 check (position_y between 0 and 100),
  focal_x smallint not null default 50 check (focal_x between 0 and 100),
  focal_y smallint not null default 50 check (focal_y between 0 and 100),
  max_width integer check (max_width is null or max_width between 120 and 3840),
  max_height integer check (max_height is null or max_height between 120 and 2160),
  border_radius smallint not null default 12 check (border_radius between 0 and 200),
  opacity numeric(3,2) not null default 1 check (opacity between 0 and 1),
  overlay text not null default '' check (length(overlay) <= 80),
  desktop_behavior text not null default 'show' check (desktop_behavior in ('show','hide')),
  mobile_behavior text not null default 'show' check (mobile_behavior in ('show','hide')),
  autoplay boolean not null default false,
  loop boolean not null default false,
  muted boolean not null default true,
  controls boolean not null default true,
  preload text not null default 'metadata' check (preload in ('none','metadata','auto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  constraint media_placements_autoplay_muted check (not autoplay or muted)
);

create index if not exists media_placements_section_order_idx on public.media_placements(section_key, is_visible, sort_order);
create index if not exists media_placements_media_idx on public.media_placements(media_id);
create index if not exists media_placements_assignment_idx
  on public.media_placements(media_id, section_key, content_item_id);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null check (length(sender_name) between 2 and 120),
  sender_email text not null check (length(sender_email) between 5 and 254),
  company text not null default '' check (length(company) <= 160),
  subject text not null check (length(subject) between 2 and 180),
  message_text text not null check (length(message_text) between 10 and 5000),
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  read_at timestamptz,
  archived_at timestamptz
);

create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.contact_messages(id) on delete cascade,
  reply_text text not null check (length(reply_text) between 2 and 10000),
  client_token uuid not null unique,
  status text not null default 'queued' check (status in ('queued','sending','sent','failed')),
  provider_id text check (provider_id is null or length(provider_id) <= 300),
  sent_at timestamptz,
  error_code text check (error_code is null or length(error_code) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id)
);

create index if not exists contact_messages_status_date_idx on public.contact_messages(status, created_at desc);
create index if not exists message_replies_message_date_idx on public.message_replies(message_id, created_at);

create or replace function public.set_updated_at_only()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_updated_at_only() from public, anon, authenticated;

drop trigger if exists media_placements_audit on public.media_placements;
create trigger media_placements_audit before insert or update on public.media_placements
for each row execute function public.set_portfolio_audit_fields();
drop trigger if exists contact_messages_updated on public.contact_messages;
create trigger contact_messages_updated before update on public.contact_messages
for each row execute function public.set_updated_at_only();
drop trigger if exists message_replies_updated on public.message_replies;
create trigger message_replies_updated before update on public.message_replies
for each row execute function public.set_updated_at_only();

create or replace function public.submit_contact_message(
  submitted_name text, submitted_email text, submitted_company text,
  submitted_subject text, submitted_message text, website text default ''
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if coalesce(trim(website), '') <> '' then raise exception 'Invalid submission'; end if;
  if length(trim(coalesce(submitted_name, ''))) not between 2 and 120 then raise exception 'Invalid name'; end if;
  if length(trim(coalesce(submitted_email, ''))) not between 5 and 254 then raise exception 'Invalid email'; end if;
  if submitted_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  if length(trim(coalesce(submitted_company, ''))) > 160 then raise exception 'Invalid company'; end if;
  if length(trim(coalesce(submitted_subject, ''))) not between 2 and 180 then raise exception 'Invalid subject'; end if;
  if length(trim(coalesce(submitted_message, ''))) not between 10 and 5000 then raise exception 'Invalid message'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lower(trim(submitted_email)), 0));
  if (select count(*) from public.contact_messages
      where lower(sender_email) = lower(trim(submitted_email)) and created_at > now() - interval '15 minutes') >= 3 then
    raise exception 'Rate limit exceeded';
  end if;
  insert into public.contact_messages(sender_name, sender_email, company, subject, message_text)
  values (left(trim(submitted_name),120), lower(left(trim(submitted_email),254)), left(trim(coalesce(submitted_company,'')),160),
          left(trim(submitted_subject),180), left(trim(submitted_message),5000)) returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.submit_contact_message(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_contact_message(text,text,text,text,text,text) to anon;

alter table public.media_placements enable row level security;
alter table public.contact_messages enable row level security;
alter table public.message_replies enable row level security;

drop policy if exists "public reads published placements" on public.media_placements;
create policy "public reads published placements" on public.media_placements for select to anon, authenticated using (
  (public.is_portfolio_admin()) or (is_visible and exists (select 1 from public.media_assets a where a.id = media_id and a.status = 'published'))
);
drop policy if exists "admins manage placements" on public.media_placements;
create policy "admins manage placements" on public.media_placements for all to authenticated
using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists "admins manage messages" on public.contact_messages;
create policy "admins manage messages" on public.contact_messages for all to authenticated
using (public.is_portfolio_admin()) with check (public.is_portfolio_admin());
drop policy if exists "admins manage replies" on public.message_replies;
create policy "admins manage replies" on public.message_replies for all to authenticated
using (public.is_portfolio_admin()) with check (public.is_portfolio_admin() and created_by = auth.uid());

revoke all on table public.media_placements, public.contact_messages, public.message_replies from anon, authenticated;
grant select on public.media_placements to anon;
grant select, insert, update, delete on public.media_placements, public.contact_messages, public.message_replies to authenticated;

-- Ensure the private bucket exists and extend it for web video. PDF remains in
-- the allow-list only for backward compatibility with assets accepted by 001-003.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media', 'portfolio-media', false, 104857600,
  array['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Recreate the policies from the already-applied 003 so the path-hardening
-- added later to that file is actually present on the remote database.
drop policy if exists "public reads portfolio media" on storage.objects;
create policy "public reads portfolio media" on storage.objects for select
to anon, authenticated using (
  bucket_id = 'portfolio-media'
  and name like 'media/%'
  and name !~ '\.\.'
  and (
    public.is_portfolio_admin()
    or exists (
      select 1 from public.media_assets
      where object_path = storage.objects.name and status = 'published'
    )
  )
);

drop policy if exists "admins upload portfolio media" on storage.objects;
create policy "admins upload portfolio media" on storage.objects for insert
to authenticated with check (
  bucket_id = 'portfolio-media'
  and name like 'media/%'
  and name !~ '\.\.'
  and public.is_portfolio_admin()
);

drop policy if exists "admins update portfolio media" on storage.objects;
create policy "admins update portfolio media" on storage.objects for update
to authenticated using (
  bucket_id = 'portfolio-media' and public.is_portfolio_admin()
) with check (
  bucket_id = 'portfolio-media'
  and name like 'media/%'
  and name !~ '\.\.'
  and public.is_portfolio_admin()
);

drop policy if exists "admins delete portfolio media" on storage.objects;
create policy "admins delete portfolio media" on storage.objects for delete
to authenticated using (
  bucket_id = 'portfolio-media' and public.is_portfolio_admin()
);

commit;
