-- ============================================================================
-- Migração inicial — Site de Casamento (Sessão 1)
-- Schema completo (seção 2 da ESPECIFICACAO.md) + RLS + 3 funções atômicas + seed.
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do Supabase e clique Run.
-- É idempotente o suficiente pra rodar uma vez num projeto novo e vazio.
-- Dinheiro SEMPRE em centavos (integer). R$ 125,00 = 12500. (Regra nº 1)
-- ============================================================================


-- ==================== ENUMS ====================
-- enum = lista fechada de valores permitidos (tipo uma coluna de escolha do SharePoint).
create type gift_type   as enum ('LINK', 'COTAS', 'LIVRE');
create type gift_status as enum ('DISPONIVEL', 'RESERVADO', 'CONCLUIDO', 'OCULTO');
create type claim_status as enum (
  'RESERVADO',              -- LINK: compromisso assumido, aguardando o dia
  'AGUARDANDO_PAGAMENTO',   -- COTAS/LIVRE: PIX gerado, esperando comprovante
  'EM_ANALISE',             -- comprovante enviado, admin vai conferir
  'PAGO',                   -- confirmado
  'RECEBIDO',               -- LINK: presente chegou às mãos dos noivos
  'CANCELADO',
  'EXPIRADO'
);
create type rsvp_status as enum ('CONFIRMADO', 'NAO_VOU');


-- ==================== PRESENTES ====================
create table gifts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  image_url     text,
  type          gift_type not null,
  status        gift_status not null default 'DISPONIVEL',
  category      text,                    -- 'Cozinha' | 'Casa' | 'Lua de mel' | ...
  sort_order    int not null default 0,

  -- LINK
  external_url  text,
  price_cents   int,                     -- valor de referência

  -- COTAS
  total_cents   int,                     -- valor total do presente
  share_cents   int,                     -- valor de UMA cota  (mirar R$ 50–150)
  total_shares  int,                     -- total_cents / share_cents (mirar 8–30)
  shares_taken  int not null default 0,  -- contador autoritativo

  -- LIVRE
  min_cents     int default 2000,        -- valor mínimo (R$ 20)

  created_at    timestamptz not null default now(),

  constraint chk_link  check (type <> 'LINK'  or external_url is not null),
  constraint chk_cotas check (type <> 'COTAS' or (share_cents > 0 and total_shares > 0)),
  -- A trava anti-overselling. É a última linha de defesa.
  constraint chk_shares check (shares_taken >= 0
                               and shares_taken <= coalesce(total_shares, 0))
);


-- ==================== CONVIDADOS ====================
create table guests (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text,                -- E.164: +5522999999999
  email             text,
  token             uuid not null unique default gen_random_uuid(),  -- vai pro localStorage

  -- RSVP (opcional, preenchido só se a pessoa confirmar presença)
  rsvp              rsvp_status,
  companions        int not null default 0,   -- acompanhantes
  rsvp_notes        text,                     -- restrição alimentar, recado
  rsvp_at           timestamptz,
  notes_approved    boolean not null default false,  -- moderação p/ o mural

  created_at        timestamptz not null default now()
);
-- Chave de deduplicação: o WhatsApp. Presente e RSVP caem no mesmo guest.
create unique index guests_phone_uniq on guests (phone) where phone is not null;


-- ==================== RESERVAS / CONTRIBUIÇÕES ====================
create table claims (
  id                uuid primary key default gen_random_uuid(),
  gift_id           uuid not null references gifts(id) on delete cascade,
  guest_id          uuid not null references guests(id),
  status            claim_status not null,

  shares            int,          -- só COTAS
  amount_cents      int,          -- COTAS: shares * share_cents | LIVRE: valor digitado | LINK: null

  message           text,         -- recadinho do convidado
  message_approved  boolean not null default false,  -- moderação p/ o mural

  payer_name        text,         -- quem aparece no extrato (pode ≠ do convidado!)
  receipt_url       text,         -- comprovante (bucket PRIVADO)
  txid              text,         -- curto, vai no QR. Já existe p/ facilitar o PSP futuro.

  expires_at        timestamptz,  -- só COTAS/LIVRE aguardando pagamento
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

create index claims_gift    on claims(gift_id);
create index claims_pending on claims(status, expires_at);
create index claims_mural   on claims(message_approved) where message is not null;


-- ============================================================================
-- RLS (Row Level Security) — "permissões da lista", regra inviolável nº 4
-- Ligado em TODA tabela desde a primeira migração. Nunca "depois eu ligo".
-- ============================================================================
alter table gifts  enable row level security;
alter table guests enable row level security;
alter table claims enable row level security;

-- gifts: qualquer um pode LER, menos os OCULTO.
-- Escrita: NENHUMA policy de insert/update/delete -> ninguém escreve pela API pública.
-- O admin escreve pelo servidor com a service_role key, que ignora o RLS.
create policy gifts_public_read on gifts
  for select
  to anon, authenticated
  using (status <> 'OCULTO');

-- guests e claims: RLS ligado e ZERO policy = navegador não lê nem escreve NADA.
-- (regra nº 3: guests/claims só via Server Action com service_role.)
-- A service_role key ignora o RLS, então o servidor continua funcionando.
-- Propositalmente sem nenhuma policy aqui.


-- ============================================================================
-- FUNÇÕES ATÔMICAS (seção 3 da ESPECIFICACAO.md) — o coração anti-concorrência
-- ============================================================================

-- 3.1 COTAS — lock de linha (for update). Duas pessoas ao mesmo tempo: só uma passa.
create or replace function reserve_shares(
  p_gift_id uuid, p_guest_id uuid, p_shares int
) returns claims
language plpgsql as $$
declare
  v_gift  gifts;
  v_claim claims;
begin
  select * into v_gift from gifts where id = p_gift_id for update;  -- trava a linha

  if v_gift.type <> 'COTAS' then
    raise exception 'TIPO_INVALIDO';
  end if;
  if p_shares < 1 then
    raise exception 'QUANTIDADE_INVALIDA';
  end if;
  if v_gift.shares_taken + p_shares > v_gift.total_shares then
    raise exception 'COTAS_INSUFICIENTES';   -- trate esse erro na UI
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

-- 3.2 LINK — update condicional. Quem chegar depois pega 0 linhas e leva JA_RESERVADO.
create or replace function reserve_link(
  p_gift_id uuid, p_guest_id uuid, p_message text
) returns claims
language plpgsql as $$
declare v_claim claims; v_rows int;
begin
  update gifts set status = 'RESERVADO'
   where id = p_gift_id and type = 'LINK' and status = 'DISPONIVEL';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    raise exception 'JA_RESERVADO';   -- trate esse erro na UI
  end if;

  insert into claims (gift_id, guest_id, status, message)
  values (p_gift_id, p_guest_id, 'RESERVADO', p_message)
  returning * into v_claim;

  return v_claim;
end; $$;

-- 3.3 Expiração — cron a cada 5 min (Sessão 7). Devolve cotas de COTAS que não pagaram.
create or replace function expire_stale_claims() returns void
language plpgsql as $$
begin
  with expirados as (
    update claims set status = 'EXPIRADO'
     where status = 'AGUARDANDO_PAGAMENTO'
       and expires_at < now()
       and shares is not null          -- LIVRE não devolve cota
    returning gift_id, shares
  ),
  agrupado as (
    select gift_id, sum(shares)::int as total from expirados group by gift_id
  )
  update gifts g
     set shares_taken = g.shares_taken - a.total,
         status = 'DISPONIVEL'
    from agrupado a
   where g.id = a.gift_id;
end; $$;


-- ============================================================================
-- SEED — 8 presentes de mentira pra testar (títulos humanos, dinheiro em centavos)
-- Cotas seguem a regra: R$ 50–150 por cota, 8–30 cotas.  total_cents = share_cents * total_shares
-- ============================================================================

-- LINK (4) — external_url obrigatório (chk_link). Troque as URLs por lojas reais depois.
insert into gifts (title, description, type, category, sort_order, external_url, price_cents) values
  ('Nossa primeira air fryer 🍟',       'Pra fritar sem culpa no apê novo.',        'LINK', 'Cozinha', 10, 'https://www.example.com/air-fryer',  45000),
  ('Jogo de toalhas pra vida toda 🛁',  'Daquelas macias que a gente nunca comprou.', 'LINK', 'Casa',  20, 'https://www.example.com/toalhas',    18000),
  ('Panelas que duram o casamento 🍳',  'Conjunto completo, pra durar décadas.',    'LINK', 'Cozinha', 30, 'https://www.example.com/panelas',    60000),
  ('Jogo de cama king 😴',              'Onde a gente vai descansar dos perrengues.', 'LINK', 'Quarto', 40, 'https://www.example.com/cama',       32000);

-- COTAS (3) — total_cents = share_cents * total_shares
insert into gifts (title, description, type, category, sort_order, total_cents, share_cents, total_shares) values
  ('Geladeira dos sonhos ❄️',           'A grande, com dispenser. Vem de cota em cota!', 'COTAS', 'Casa',      50, 360000, 15000, 24),
  ('Nosso sofá pra maratonar séries 🛋️','Pra receber vocês nos domingos.',               'COTAS', 'Casa',      60, 240000, 12000, 20),
  ('Uma noite especial na lua de mel 🌙','Ajude a gente a dormir num lugar dos sonhos.',  'COTAS', 'Lua de mel', 70, 200000, 10000, 20);

-- LIVRE (1)
insert into gifts (title, description, type, category, sort_order, min_cents) values
  ('Ajude na nossa lua de mel ✈️',      'Qualquer valor ajuda a gente a viajar. 💝',    'LIVRE', 'Lua de mel', 80, 2000);
