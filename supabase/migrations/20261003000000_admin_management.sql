begin;

-- Operações administrativas atômicas. Não altera reservas existentes ao aplicar.
create table public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  entity_id uuid not null,
  reason text,
  before_data jsonb not null,
  after_data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.admin_activity enable row level security;
revoke all on public.admin_activity from public, anon, authenticated;
grant select, insert on public.admin_activity to service_role;
create index admin_activity_entity on public.admin_activity(entity_id, created_at desc);

create or replace function public.admin_management_ready() returns boolean
language sql security definer set search_path = public, pg_temp
as $$ select true $$;

create or replace function public.admin_edit_message(
  p_id uuid, p_source text, p_text text, p_expected_text text, p_actor uuid
) returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_old text;
begin
  if p_actor is null or p_source is null or p_source not in ('CLAIM', 'RSVP')
     or p_text is null or length(btrim(p_text)) not between 1 and 2000 then
    raise exception 'ENTRADA_INVALIDA';
  end if;
  if p_source = 'CLAIM' then
    select message into v_old from public.claims where id = p_id for update;
  else
    select rsvp_notes into v_old from public.guests where id = p_id for update;
  end if;
  if not found or v_old is null then raise exception 'RECADO_NAO_ENCONTRADO'; end if;
  if btrim(v_old) is distinct from p_expected_text then raise exception 'CONFLITO_EDICAO'; end if;
  if p_source = 'CLAIM' then
    update public.claims set message = btrim(p_text) where id = p_id;
  else
    update public.guests set rsvp_notes = btrim(p_text) where id = p_id;
  end if;
  insert into public.admin_activity(actor_id, action, entity_id, before_data, after_data)
    values(p_actor, 'EDIT_' || p_source || '_MESSAGE', p_id,
      jsonb_build_object('message', v_old), jsonb_build_object('message', btrim(p_text)));
end;
$$;

create or replace function public.admin_manage_reservation(
  p_claim_id uuid, p_action text, p_reason text, p_actor uuid
) returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_claim public.claims;
  v_gift public.gifts;
  v_new_status public.claim_status;
begin
  if p_actor is null or p_action is null or p_action not in ('CANCEL', 'RECEIVE', 'REOPEN')
     or p_reason is null or length(btrim(p_reason)) not between 3 and 300 then
    raise exception 'ENTRADA_INVALIDA';
  end if;
  select * into v_claim from public.claims where id = p_claim_id for update;
  if not found then raise exception 'RESERVA_NAO_ENCONTRADA'; end if;
  select * into v_gift from public.gifts where id = v_claim.gift_id for update;
  if not found then raise exception 'PRESENTE_NAO_ENCONTRADO'; end if;

  if p_action = 'CANCEL' then
    -- Pagamentos confirmados não são cancelados nem estornados por esta função.
    if v_claim.status not in ('RESERVADO', 'AGUARDANDO_PAGAMENTO', 'EM_ANALISE') then
      raise exception 'STATUS_INVALIDO';
    end if;
    v_new_status := 'CANCELADO';
    if v_gift.type = 'COTAS' then
      if v_claim.shares is null or v_claim.shares < 1 or v_gift.shares_taken < v_claim.shares then
        raise exception 'COTAS_INCONSISTENTES';
      end if;
      update public.gifts set shares_taken = shares_taken - v_claim.shares,
        status = case when status = 'OCULTO' then status else 'DISPONIVEL'::public.gift_status end
        where id = v_gift.id;
    elsif v_gift.type = 'LINK' then
      update public.gifts set status = case when status = 'OCULTO' then status else 'DISPONIVEL'::public.gift_status end
        where id = v_gift.id;
    end if;
  elsif p_action = 'RECEIVE' then
    if v_gift.type <> 'LINK' or v_claim.status <> 'RESERVADO' then raise exception 'STATUS_INVALIDO'; end if;
    v_new_status := 'RECEBIDO';
    update public.gifts set status = case when status = 'OCULTO' then status else 'CONCLUIDO'::public.gift_status end where id = v_gift.id;
  else
    if v_gift.type <> 'LINK' or v_claim.status <> 'RECEBIDO' then raise exception 'STATUS_INVALIDO'; end if;
    v_new_status := 'RESERVADO';
    update public.gifts set status = case when status = 'OCULTO' then status else 'RESERVADO'::public.gift_status end where id = v_gift.id;
  end if;
  -- Mantém identificação, recado e comprovante privado para consulta histórica.
  update public.claims set status = v_new_status where id = v_claim.id;
  insert into public.admin_activity(actor_id, action, entity_id, reason, before_data, after_data)
    values(p_actor, p_action, v_claim.id, btrim(p_reason),
      jsonb_build_object('status', v_claim.status, 'gift_id', v_claim.gift_id, 'shares', v_claim.shares),
      jsonb_build_object('status', v_new_status));
end;
$$;

revoke all on function public.admin_management_ready() from public, anon, authenticated;
revoke all on function public.admin_edit_message(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.admin_manage_reservation(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_management_ready() to service_role;
grant execute on function public.admin_edit_message(uuid, text, text, text, uuid) to service_role;
grant execute on function public.admin_manage_reservation(uuid, text, text, uuid) to service_role;

-- Evita que a exclusão em cascata destrua histórico de reservas,
-- inclusive quando uma reserva acontece junto de uma tentativa de exclusão.
create or replace function public.prevent_gift_history_deletion() returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if exists(select 1 from public.claims where gift_id = old.id) then
    raise exception 'PRESENTE_COM_HISTORICO';
  end if;
  return old;
end;
$$;
revoke all on function public.prevent_gift_history_deletion() from public, anon, authenticated;
create trigger prevent_gift_history_deletion before delete on public.gifts
for each row execute function public.prevent_gift_history_deletion();

commit;
