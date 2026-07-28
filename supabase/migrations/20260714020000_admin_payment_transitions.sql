-- Transições administrativas atômicas para pagamentos PIX.

create or replace function confirm_payment(p_claim_id uuid)
returns claims
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim claims;
begin
  update claims
     set status = 'PAGO', paid_at = now()
   where id = p_claim_id and status = 'EM_ANALISE'
  returning * into v_claim;

  if v_claim.id is null then
    raise exception 'STATUS_INVALIDO';
  end if;

  return v_claim;
end;
$$;

create or replace function reject_payment(p_claim_id uuid)
returns table (claim_id uuid, receipt_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim claims;
begin
  select * into v_claim from claims where id = p_claim_id for update;

  if v_claim.id is null or v_claim.status <> 'EM_ANALISE' then
    raise exception 'STATUS_INVALIDO';
  end if;

  update claims
     set status = 'CANCELADO', receipt_url = null
   where id = v_claim.id;

  if v_claim.shares is not null then
    update gifts
       set shares_taken = greatest(0, shares_taken - v_claim.shares),
           status = case
             when status = 'CONCLUIDO' then 'DISPONIVEL'::gift_status
             else status
           end
     where id = v_claim.gift_id and type = 'COTAS';
  end if;

  return query select v_claim.id, v_claim.receipt_url;
end;
$$;

revoke all on function confirm_payment(uuid) from public, anon, authenticated;
revoke all on function reject_payment(uuid) from public, anon, authenticated;
grant execute on function confirm_payment(uuid) to service_role;
grant execute on function reject_payment(uuid) to service_role;
