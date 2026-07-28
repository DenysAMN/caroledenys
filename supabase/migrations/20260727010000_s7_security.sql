-- S7: rate limit atômico, expiração automática e auditoria de RLS/grants.

create extension if not exists pg_cron with schema pg_catalog;

-- Guarda somente HMAC-SHA256 do IP. O IP puro nunca chega ao banco.
create table if not exists public.reservation_rate_limits (
  key_hash          text primary key
                    check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  attempts          integer not null default 1 check (attempts >= 1),
  updated_at        timestamptz not null default now()
);

alter table public.reservation_rate_limits enable row level security;
revoke all on table public.reservation_rate_limits
  from public, anon, authenticated;
grant select, insert, update, delete on table public.reservation_rate_limits
  to service_role;

-- Um único UPSERT serializa tentativas concorrentes do mesmo IP.
create or replace function public.consume_reservation_rate_limit(
  p_key_hash text,
  p_limit integer default 5,
  p_window_seconds integer default 60
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_attempts integer;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$'
     or p_limit < 1 or p_limit > 100
     or p_window_seconds < 1 or p_window_seconds > 3600 then
    return false;
  end if;

  insert into public.reservation_rate_limits as limits (
    key_hash, window_started_at, attempts, updated_at
  )
  values (p_key_hash, v_now, 1, v_now)
  on conflict (key_hash) do update
    set window_started_at = case
          when limits.window_started_at <=
               v_now - make_interval(secs => p_window_seconds)
            then v_now
          else limits.window_started_at
        end,
        attempts = case
          when limits.window_started_at <=
               v_now - make_interval(secs => p_window_seconds)
            then 1
          else limits.attempts + 1
        end,
        updated_at = v_now
  returning attempts into v_attempts;

  return v_attempts <= p_limit;
end;
$$;

revoke all on function public.consume_reservation_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_reservation_rate_limit(text, integer, integer)
  to service_role;

-- Recria a expiração com search_path fixo. Presente oculto continua oculto.
create or replace function public.expire_stale_claims() returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  with expired as (
    update public.claims
       set status = 'EXPIRADO'
     where status = 'AGUARDANDO_PAGAMENTO'
       and expires_at < now()
       and shares is not null
    returning gift_id, shares
  ),
  grouped as (
    select gift_id, sum(shares)::integer as total
      from expired
     group by gift_id
  )
  update public.gifts as gifts
     set shares_taken = greatest(0, gifts.shares_taken - grouped.total),
         status = case
           when gifts.status = 'OCULTO'
             then 'OCULTO'::public.gift_status
           else 'DISPONIVEL'::public.gift_status
         end
    from grouped
   where gifts.id = grouped.gift_id
     and gifts.type = 'COTAS';

  delete from public.reservation_rate_limits
   where updated_at < now() - interval '7 days';
end;
$$;

revoke all on function public.expire_stale_claims()
  from public, anon, authenticated;
grant execute on function public.expire_stale_claims()
  to service_role;

-- As reservas são chamadas apenas pelas Server Actions com service_role.
revoke all on function public.reserve_link(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.reserve_shares(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_link(uuid, uuid, text)
  to service_role;
grant execute on function public.reserve_shares(uuid, uuid, integer)
  to service_role;

-- Reforça grants administrativos criados na S5.
revoke all on function public.confirm_payment(uuid)
  from public, anon, authenticated;
revoke all on function public.reject_payment(uuid)
  from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid)
  to service_role;
grant execute on function public.reject_payment(uuid)
  to service_role;

-- Recriação idempotente: cron.schedule sobrescreve por nome, mas removemos
-- explicitamente para manter compatibilidade entre versões do pg_cron.
select cron.unschedule(jobid)
  from cron.job
 where jobname = 'expire-stale-claims';

select cron.schedule(
  'expire-stale-claims',
  '*/5 * * * *',
  'select public.expire_stale_claims();'
);

-- Auditoria de implantação, acessível somente pela service_role.
create or replace function public.s7_security_status() returns jsonb
language sql
stable
security definer
set search_path = public, pg_catalog, pg_temp
as $$
  select jsonb_build_object(
    'cron_scheduled', exists(
      select 1 from cron.job
       where jobname = 'expire-stale-claims'
         and schedule = '*/5 * * * *'
         and active is true
    ),
    'guests_rls', (
      select relrowsecurity from pg_class
       where oid = 'public.guests'::regclass
    ),
    'claims_rls', (
      select relrowsecurity from pg_class
       where oid = 'public.claims'::regclass
    ),
    'rate_limits_rls', (
      select relrowsecurity from pg_class
       where oid = 'public.reservation_rate_limits'::regclass
    ),
    'guests_policies', (
      select count(*) from pg_policies
       where schemaname = 'public' and tablename = 'guests'
    ),
    'claims_policies', (
      select count(*) from pg_policies
       where schemaname = 'public' and tablename = 'claims'
    ),
    'rate_limits_policies', (
      select count(*) from pg_policies
       where schemaname = 'public' and tablename = 'reservation_rate_limits'
    ),
    'anon_can_expire', has_function_privilege(
      'anon', 'public.expire_stale_claims()', 'EXECUTE'
    ),
    'anon_can_rate_limit', has_function_privilege(
      'anon',
      'public.consume_reservation_rate_limit(text,integer,integer)',
      'EXECUTE'
    ),
    'anon_can_reserve_link', has_function_privilege(
      'anon', 'public.reserve_link(uuid,uuid,text)', 'EXECUTE'
    ),
    'anon_can_reserve_shares', has_function_privilege(
      'anon', 'public.reserve_shares(uuid,uuid,integer)', 'EXECUTE'
    )
  );
$$;

revoke all on function public.s7_security_status()
  from public, anon, authenticated;
grant execute on function public.s7_security_status()
  to service_role;
