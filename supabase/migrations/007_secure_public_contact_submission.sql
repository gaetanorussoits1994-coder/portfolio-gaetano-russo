-- Secure the public contact flow after migrations 001-006.
-- Apply this migration manually before deploying the matching frontend.

begin;

alter table public.contact_messages enable row level security;
alter table public.message_replies enable row level security;

-- Browser roles never receive generic table access. Active administrators keep
-- their existing authenticated grants and RLS policies from migration 005.
revoke all on table public.contact_messages from public, anon;
revoke all on table public.message_replies from public, anon;

-- Retire the six-argument browser entry point without dropping it. Its missing
-- authenticated grant caused HTTP 403 whenever the shared client held a session.
revoke all on function public.submit_contact_message(text,text,text,text,text,text)
  from public, anon, authenticated;

create or replace function public.submit_contact_message(
  submitted_name text,
  submitted_email text,
  submitted_company text,
  submitted_subject text,
  submitted_message text,
  submitted_privacy_consent boolean,
  website text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_name text := pg_catalog.regexp_replace(pg_catalog.btrim(coalesce(submitted_name, '')), '[[:space:]]+', ' ', 'g');
  normalized_email text := pg_catalog.lower(pg_catalog.btrim(coalesce(submitted_email, '')));
  normalized_company text := pg_catalog.regexp_replace(pg_catalog.btrim(coalesce(submitted_company, '')), '[[:space:]]+', ' ', 'g');
  normalized_subject text := pg_catalog.regexp_replace(pg_catalog.btrim(coalesce(submitted_subject, '')), '[[:space:]]+', ' ', 'g');
  normalized_message text := pg_catalog.btrim(coalesce(submitted_message, ''));
begin
  if submitted_privacy_consent is distinct from true then
    raise exception 'Invalid submission';
  end if;
  if coalesce(pg_catalog.btrim(website), '') <> '' then
    raise exception 'Invalid submission';
  end if;
  if pg_catalog.length(normalized_name) not between 2 and 120 then
    raise exception 'Invalid submission';
  end if;
  if pg_catalog.length(normalized_email) not between 5 and 254
     or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Invalid submission';
  end if;
  if pg_catalog.length(normalized_company) > 160 then
    raise exception 'Invalid submission';
  end if;
  if pg_catalog.length(normalized_subject) not between 2 and 180 then
    raise exception 'Invalid submission';
  end if;
  if pg_catalog.length(normalized_message) not between 10 and 5000 then
    raise exception 'Invalid submission';
  end if;

  -- Contact fields are plain text. Reject markup instead of attempting to
  -- sanitize it in a privileged database function.
  if normalized_name ~ '[<>]'
     or normalized_email ~ '[<>]'
     or normalized_company ~ '[<>]'
     or normalized_subject ~ '[<>]'
     or normalized_message ~ '[<>]' then
    raise exception 'Invalid submission';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(normalized_email, 0)
  );
  if (
    select pg_catalog.count(*)
    from public.contact_messages as recent_message
    where pg_catalog.lower(recent_message.sender_email) = normalized_email
      and recent_message.created_at > pg_catalog.now() - interval '15 minutes'
  ) >= 3 then
    raise exception 'Rate limit exceeded';
  end if;

  insert into public.contact_messages (
    sender_name,
    sender_email,
    company,
    subject,
    message_text,
    status,
    created_at,
    updated_at
  ) values (
    normalized_name,
    normalized_email,
    normalized_company,
    normalized_subject,
    normalized_message,
    'new',
    pg_catalog.now(),
    pg_catalog.now()
  );

  return pg_catalog.jsonb_build_object('accepted', true);
end;
$$;

revoke all on function public.submit_contact_message(text,text,text,text,text,boolean,text)
  from public, anon, authenticated;
grant execute on function public.submit_contact_message(text,text,text,text,text,boolean,text)
  to anon, authenticated;

commit;
