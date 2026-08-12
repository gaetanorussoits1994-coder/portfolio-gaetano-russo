insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media', 'portfolio-media', false, 8388608,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
to authenticated using (bucket_id = 'portfolio-media' and public.is_portfolio_admin());
