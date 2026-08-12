create extension if not exists pgcrypto;

do $$ begin
  create type public.content_status as enum ('draft', 'published', 'hidden');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9_.-]{1,79}$'),
  value jsonb not null default '{}'::jsonb check (jsonb_typeof(value) in ('object', 'array', 'string', 'number', 'boolean')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('hero','profile','infrastructure_case','web_project','skill','technical_lab','experience','certificate','contact_link','contact_copy','seo','section')),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 2 and 100),
  category text check (category is null or length(category) <= 80),
  title_it text not null default '' check (length(title_it) <= 180),
  title_en text not null default '' check (length(title_en) <= 180),
  summary_it text not null default '' check (length(summary_it) <= 600),
  summary_en text not null default '' check (length(summary_en) <= 600),
  body_it text not null default '' check (length(body_it) <= 12000),
  body_en text not null default '' check (length(body_en) <= 12000),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  sort_order integer not null default 0 check (sort_order between -10000 and 10000),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  unique (content_type, slug)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'portfolio-media' check (bucket_id = 'portfolio-media'),
  object_path text not null unique check (object_path like 'media/%' and object_path !~ '\.\.'),
  original_name text not null check (length(original_name) between 1 and 240),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 8388608),
  alt_it text not null check (length(alt_it) between 2 and 300),
  alt_en text not null check (length(alt_en) between 2 and 300),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create index if not exists content_items_public_order_idx on public.content_items (content_type, status, sort_order);
create index if not exists media_assets_public_idx on public.media_assets (status, created_at desc);

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
    join auth.users as account on account.id = administrator.user_id
    where administrator.user_id = auth.uid()
      and administrator.is_active = true
      and lower(account.email) = 'g.russomacteanimo@gmail.com'
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
  if lower(trim(target_email)) <> 'g.russomacteanimo@gmail.com' then
    raise exception 'Email not allowed for portfolio administration';
  end if;
  select id into target_id from auth.users where lower(email) = lower(trim(target_email)) limit 1;
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

drop trigger if exists content_items_audit on public.content_items;
create trigger content_items_audit before insert or update on public.content_items
for each row execute function public.set_portfolio_audit_fields();
drop trigger if exists media_assets_audit on public.media_assets;
create trigger media_assets_audit before insert or update on public.media_assets
for each row execute function public.set_portfolio_audit_fields();
drop trigger if exists site_settings_audit on public.site_settings;
create trigger site_settings_audit before insert or update on public.site_settings
for each row execute function public.set_site_settings_audit_fields();
