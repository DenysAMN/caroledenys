-- Impede reserva de presente COTAS oculto/indisponível também dentro da função
-- atômica. A checagem no app melhora a mensagem; esta é a defesa autoritativa.
create or replace function reserve_shares(
  p_gift_id uuid, p_guest_id uuid, p_shares int
) returns claims
language plpgsql as $$
declare
  v_gift  gifts;
  v_claim claims;
begin
  select * into v_gift from gifts where id = p_gift_id for update;

  if v_gift.type <> 'COTAS' then
    raise exception 'TIPO_INVALIDO';
  end if;
  if v_gift.status <> 'DISPONIVEL' then
    raise exception 'PRESENTE_INDISPONIVEL';
  end if;
  if p_shares < 1 then
    raise exception 'QUANTIDADE_INVALIDA';
  end if;
  if v_gift.shares_taken + p_shares > v_gift.total_shares then
    raise exception 'COTAS_INSUFICIENTES';
  end if;

  update gifts
     set shares_taken = shares_taken + p_shares,
         status = case when shares_taken + p_shares >= total_shares
                       then 'CONCLUIDO'::gift_status else status end
   where id = p_gift_id;

  insert into claims (gift_id, guest_id, status, shares, amount_cents, expires_at, txid)
  values (p_gift_id, p_guest_id, 'AGUARDANDO_PAGAMENTO',
          p_shares, p_shares * v_gift.share_cents,
          now() + interval '60 minutes',
          upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 12)))
  returning * into v_claim;

  return v_claim;
end; $$;
