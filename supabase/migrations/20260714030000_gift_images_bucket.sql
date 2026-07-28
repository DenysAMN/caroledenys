-- Imagens públicas do catálogo; escrita continua exclusiva do servidor/admin.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'gift-images',
  'gift-images',
  true,
  4000000,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket público libera somente leitura. Sem policies de insert/update/delete
-- para anon ou authenticated; uploads passam pela secret key no servidor.
