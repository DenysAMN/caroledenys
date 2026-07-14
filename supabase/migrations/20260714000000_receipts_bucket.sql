-- Bucket privado para comprovantes PIX.
-- O navegador envia somente por URL assinada; leitura fica restrita ao servidor/admin.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'receipts',
  'receipts',
  false,
  5000000,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Sem policies públicas em storage.objects.
-- A service/secret key cria URLs assinadas de upload e, na S5, URLs assinadas de leitura.
