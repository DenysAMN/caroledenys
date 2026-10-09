begin;

create table public.gallery_settings (
  id boolean primary key default true check (id),
  home_limit integer not null default 6 check (home_limit between 0 and 12),
  revision bigint not null default 0 check (revision >= 0)
);
insert into public.gallery_settings(id) values(true);
create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  storage_path text unique,
  alt text not null check (length(btrim(alt)) between 2 and 240),
  caption text not null default '' check (length(caption) <= 240),
  width integer not null check (width between 100 and 20000),
  height integer not null check (height between 100 and 20000),
  placement text not null default 'GALLERY' check (placement in ('GALLERY','COVER','STORY','TRANSITION','INSPIRATION')),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index gallery_single_placement on public.gallery_photos(placement) where placement in ('COVER','STORY','TRANSITION');
create index gallery_order on public.gallery_photos(sort_order,id);
alter table public.gallery_settings enable row level security;
alter table public.gallery_photos enable row level security;
create policy gallery_settings_read on public.gallery_settings for select to anon,authenticated using(true);
create policy gallery_photos_read on public.gallery_photos for select to anon,authenticated using(published);
revoke all on public.gallery_photos,public.gallery_settings from public,anon,authenticated;
grant select on public.gallery_photos,public.gallery_settings to anon,authenticated;
grant all on public.gallery_photos,public.gallery_settings to service_role;

-- As fotos atuais permanecem no repositório; não é necessário reenviá-las.
insert into public.gallery_photos(id,src,alt,width,height,placement,caption,sort_order) values
('00000000-0000-4000-8000-000000000001','/images/ensaio/principal-1.jpg','Carol e Denys juntos no campo durante o ensaio',1365,2048,'COVER','',0),
('00000000-0000-4000-8000-000000000002','/images/ensaio/principal-3.jpg','Carol sorrindo para Denys durante o ensaio',1365,2048,'STORY','',1),
('00000000-0000-4000-8000-000000000003','/images/ensaio/principal-2.jpg','Carol e Denys dançando juntos no campo',1365,2048,'TRANSITION','',2),
('00000000-0000-4000-8000-000000000004','/images/ensaio/mg-0015.jpg','Carol e Denys caminhando de mãos dadas pelo campo',1365,2048,'GALLERY','',3),
('00000000-0000-4000-8000-000000000005','/images/ensaio/mg-0019.jpg','Carol e Denys seguindo juntos por uma trilha no campo',2048,1365,'GALLERY','',4),
('00000000-0000-4000-8000-000000000006','/images/ensaio/mg-0060.jpg','Carol puxando Denys pela mão e sorrindo durante o ensaio',2048,1365,'GALLERY','',5),
('00000000-0000-4000-8000-000000000007','/images/ensaio/mg-0026.jpg','Carol olhando para a câmera com Denys ao seu lado no campo',1365,2048,'GALLERY','',6),
('00000000-0000-4000-8000-000000000008','/images/ensaio/mg-0105.jpg','Carol e Denys rindo com as testas encostadas',1365,2048,'GALLERY','',7),
('00000000-0000-4000-8000-000000000009','/images/ensaio/mg-0084.jpg','Carol e Denys dançando e sorrindo no campo',2048,1365,'GALLERY','',8),
('00000000-0000-4000-8000-000000000010','/images/ensaio/mg-0074.jpg','Carol e Denys dançando em um retrato espontâneo em preto e branco',1365,2048,'GALLERY','',9),
('00000000-0000-4000-8000-000000000011','/images/ensaio/mg-0315.jpg','Carol e Denys girando juntos sob a luz do fim da tarde',1365,2048,'GALLERY','',10),
('00000000-0000-4000-8000-000000000012','/images/ensaio/mg-0323.jpg','Denys inclinando Carol durante a dança no campo',1365,2048,'GALLERY','',11),
('00000000-0000-4000-8000-000000000013','/images/ensaio/foto-engracada.jpg','Carol ajeitando o vestido enquanto Denys observa em um momento divertido',1365,2048,'GALLERY','Essa também somos nós.',12),
('00000000-0000-4000-8000-000000000014','/images/inspiracao/mesa-ao-ar-livre.jpg','Inspiração de mesas compridas ao ar livre com flores em vinho e verde',1066,1600,'INSPIRATION','',13),
('00000000-0000-4000-8000-000000000015','/images/inspiracao/flores-vinho-e-verde.jpg','Inspiração floral em branco, vinho e verde profundo',880,1200,'INSPIRATION','',14),
('00000000-0000-4000-8000-000000000016','/images/inspiracao/mesa-junto-ao-lago.jpg','Inspiração de mesa com velas e flores brancas junto à água',1000,1500,'INSPIRATION','',15),
('00000000-0000-4000-8000-000000000017','/images/inspiracao/arranjo-e-velas.jpg','Inspiração de arranjo com folhagens, flores vinho e velas',1080,1439,'INSPIRATION','',16);

-- SQL invoker: a leitura pública respeita RLS e nunca inclui fotos ocultas.
create or replace function public.public_gallery_snapshot() returns jsonb
language sql security invoker set search_path = public,pg_temp
as $$ select jsonb_build_object('home_limit',s.home_limit,'revision',s.revision,
  'photos',coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order,p.id) from public.gallery_photos p where p.published),'[]'::jsonb))
  from public.gallery_settings s where s.id $$;
create or replace function public.admin_gallery_snapshot() returns jsonb
language sql security definer set search_path = public,pg_temp
as $$ select jsonb_build_object('home_limit',s.home_limit,'revision',s.revision,
  'photos',coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order,p.id) from public.gallery_photos p),'[]'::jsonb))
  from public.gallery_settings s where s.id $$;

create or replace function public.admin_mutate_gallery(p_action text,p_payload jsonb,p_revision bigint) returns jsonb
language plpgsql security definer set search_path = public,pg_temp
as $$
declare
  v_revision bigint; v_photo public.gallery_photos; v_id uuid; v_ids uuid[];
  v_place text; v_src text; v_path text; v_width integer; v_height integer; v_removed text;
begin
  select revision into v_revision from public.gallery_settings where id for update;
  if p_revision is distinct from v_revision then raise exception 'GALERIA_ALTERADA'; end if;
  if p_action = 'SAVE' then
    v_id := (p_payload->>'id')::uuid;
    if v_id is null then raise exception 'ENTRADA_INVALIDA'; end if;
    select * into v_photo from public.gallery_photos where id=v_id;
    v_place := p_payload->>'placement';
    if v_place is null or v_place not in ('GALLERY','COVER','STORY','TRANSITION','INSPIRATION')
      or p_payload->>'alt' is null or length(btrim(p_payload->>'alt')) not between 2 and 240
      or length(coalesce(p_payload->>'caption','')) > 240 then raise exception 'ENTRADA_INVALIDA'; end if;
    v_src := coalesce(p_payload->>'src',v_photo.src);
    v_path := case when p_payload ? 'src' then p_payload->>'storage_path' else v_photo.storage_path end;
    v_width := coalesce((p_payload->>'width')::integer,v_photo.width);
    v_height := coalesce((p_payload->>'height')::integer,v_photo.height);
    if v_src is null or v_width is null or v_height is null then raise exception 'ENTRADA_INVALIDA'; end if;
    if v_photo.id is null and (select count(*) from public.gallery_photos)>=500 then raise exception 'LIMITE_FOTOS'; end if;
    -- A foto anteriormente destacada volta para a galeria, sem desaparecer.
    if v_place in ('COVER','STORY','TRANSITION') then
      update public.gallery_photos set placement='GALLERY' where placement=v_place and id<>v_id;
    end if;
    insert into public.gallery_photos(id,src,storage_path,alt,caption,width,height,placement,published,sort_order)
      values(v_id,v_src,v_path,btrim(p_payload->>'alt'),coalesce(p_payload->>'caption',''),v_width,v_height,v_place,
        coalesce((p_payload->>'published')::boolean,true),coalesce((select max(sort_order)+1 from public.gallery_photos),0))
      on conflict(id) do update set src=excluded.src,storage_path=excluded.storage_path,alt=excluded.alt,
        caption=excluded.caption,width=excluded.width,height=excluded.height,placement=excluded.placement,published=excluded.published;
    if v_photo.storage_path is distinct from v_path then v_removed := v_photo.storage_path; end if;
  elsif p_action='DELETE' then
    v_id := (p_payload->>'id')::uuid;
    delete from public.gallery_photos where id=v_id returning storage_path into v_removed;
    if not found then raise exception 'FOTO_NAO_ENCONTRADA'; end if;
  elsif p_action='ORDER' then
    select coalesce(array_agg(value::uuid),'{}'::uuid[]) into v_ids from jsonb_array_elements_text(p_payload->'ids');
    if cardinality(v_ids)<>(select count(*) from public.gallery_photos)
      or cardinality(v_ids)<>(select count(distinct x) from unnest(v_ids) x)
      or exists(select 1 from unnest(v_ids) x where not exists(select 1 from public.gallery_photos where id=x)) then raise exception 'GALERIA_ALTERADA'; end if;
    update public.gallery_photos p set sort_order=ordered.ordinality::integer-1 from unnest(v_ids) with ordinality as ordered(id,ordinality) where p.id=ordered.id;
  elsif p_action='SETTINGS' then
    if (p_payload->>'home_limit') is null or (p_payload->>'home_limit')::integer not between 0 and 12 then raise exception 'ENTRADA_INVALIDA'; end if;
    update public.gallery_settings set home_limit=(p_payload->>'home_limit')::integer where id;
  else raise exception 'ENTRADA_INVALIDA'; end if;
  update public.gallery_settings set revision=revision+1 where id returning revision into v_revision;
  return jsonb_build_object('revision',v_revision,'removed_path',v_removed);
end;
$$;
revoke all on function public.public_gallery_snapshot() from public;
grant execute on function public.public_gallery_snapshot() to anon,authenticated,service_role;
revoke all on function public.admin_gallery_snapshot() from public,anon,authenticated;
revoke all on function public.admin_mutate_gallery(text,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.admin_gallery_snapshot() to service_role;
grant execute on function public.admin_mutate_gallery(text,jsonb,bigint) to service_role;

-- Somente o servidor autenticado como service_role envia/remove arquivos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('gallery-images','gallery-images',true,4000000,array['image/webp','image/jpeg','image/png']);
commit;
