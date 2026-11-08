begin;

-- Planejador da lua de mel, só para o painel dos noivos.
-- Uma única linha (singleton) com o plano inteiro em JSON; `revision` impede
-- que duas pessoas sobrescrevam uma à outra (concorrência otimista).
create table public.honeymoon_plan (
  id boolean primary key default true check (id),
  data jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
insert into public.honeymoon_plan(id) values (true);

-- Sem política: anon e authenticated não leem nem escrevem. Só o servidor
-- (service_role, que ignora o RLS) acessa, depois de conferir o admin.
alter table public.honeymoon_plan enable row level security;
revoke all on public.honeymoon_plan from public, anon, authenticated;
grant all on public.honeymoon_plan to service_role;

-- Grava somente se a revisão enviada for a atual; devolve a nova revisão.
-- Revisão diferente = outra pessoa salvou antes: 'STALE_REVISION'.
create or replace function public.admin_save_honeymoon_plan(p_data jsonb, p_revision bigint) returns bigint
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_revision bigint;
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'INVALID_PLAN'; end if;
  -- O app limita a 300 KB; aqui fica uma folga para a forma de texto do jsonb.
  if octet_length(p_data::text) > 524288 then raise exception 'PLAN_TOO_LARGE'; end if;
  update public.honeymoon_plan
     set data = p_data, revision = revision + 1, updated_at = now()
   where id and revision = p_revision
  returning revision into v_revision;
  if v_revision is null then raise exception 'STALE_REVISION'; end if;
  return v_revision;
end;
$$;
revoke all on function public.admin_save_honeymoon_plan(jsonb, bigint) from public, anon, authenticated;
grant execute on function public.admin_save_honeymoon_plan(jsonb, bigint) to service_role;

commit;
