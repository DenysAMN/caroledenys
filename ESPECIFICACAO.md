# Site de Casamento — Especificação Técnica (v2, decisões travadas)

> Documento de referência do projeto. Anexe no Claude Code no início de cada sessão.
> O `CLAUDE.md` (arquivo separado, na raiz do repo) guarda o **estado atual**. Este aqui guarda o **plano**.

> **Adendo de 20/08/2026:** a confirmação de presença migrou para outra
> plataforma. A rota `/confirmar`, os CTAs e a seção pública de RSVP foram
> removidos. Estrutura e dados históricos permanecem somente para consulta e
> administração. Este adendo prevalece sobre referências antigas a RSVP abaixo.

---

## 0. Decisões travadas

| # | Decisão | Escolha |
|---|---|---|
| 1 | Confirmação PIX | **Manual** (chave estática + comprovante + aprovação no painel). Arquitetura preparada para trocar por PSP depois. |
| 2 | Identificação do convidado | **Sem login.** Nome + WhatsApp na hora de reservar presentes. RSVP público removido. |
| 3 | Stack | Next.js 16 (App Router) + TypeScript + Tailwind + Supabase + Vercel |
| 4 | Ferramenta de dev | **Claude Code** (computador pessoal, sem restrição de instalação) |
| 5 | Prazo | ~6 meses, trabalhados em janelas entre embarques → sessões precisam ser retomáveis |
| 6 | Escopo | Presentes (LINK / COTAS / LIVRE) + Mural + Contagem regressiva + História + Ensaio + Páginas de conteúdo |
| 7 | Mural | Exibe `claims.message` e registros históricos aprovados. Sem escrita pública anônima. |
| 8 | Catálogo | ~22 presentes: ~14 LINK, ~6 COTAS, ~2 LIVRE |
| 9 | Domínio | Subdomínio grátis da Vercel (`___.vercel.app`). Domínio próprio fica como opção futura. |

---

## 1. Regras invioláveis

1. **Dinheiro em centavos (`integer`).** Nunca `float`, nunca `numeric` no app. `R$ 125,00` = `12500`.
2. **Toda reserva passa por função atômica no Postgres.** Nunca `SELECT` → checar → `UPDATE` no código da aplicação.
3. **Nenhuma leitura de `guests` ou `claims` a partir do navegador.** Só via Server Action / Route Handler usando `service_role`. A `service_role key` nunca sai do servidor.
4. **RLS ligado desde a primeira migração.** Nunca "depois eu ligo".
5. **Mobile-first.** A maioria vai abrir o link dentro do WhatsApp, no celular, no 4G.
6. **Confirmação de pagamento é UMA função** — `confirmarPagamento(claimId)`. Hoje chamada pelo botão do admin; amanhã pelo webhook do PSP. Não espalhe essa lógica dentro de componente de UI.
7. **Datas em `timestamptz` (UTC) no banco.** Converta só na exibição.

---

## 2. Modelo de dados (completo)

```sql
-- ==================== ENUMS ====================
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
  -- ⬇ A trava anti-overselling. É a última linha de defesa.
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
```

### Máquina de estados

```
LINK
  gift: DISPONIVEL --[reserva]--> RESERVADO --[admin: recebi]--> CONCLUIDO
                        └--[admin libera / desistiu]--> DISPONIVEL
  claim: RESERVADO --> RECEBIDO | CANCELADO

COTAS
  claim: AGUARDANDO_PAGAMENTO --[envia comprovante]--> EM_ANALISE --[admin confirma]--> PAGO
                  └--[60 min sem comprovante]--> EXPIRADO  (devolve cotas ao pool)
  gift:  shares_taken == total_shares  -->  CONCLUIDO

LIVRE
  igual a COTAS, mas sem escassez: o gift NUNCA vai a CONCLUIDO e não há
  contador de cotas. Logo, não precisa de lock — só cria o claim.
```

> `EM_ANALISE` **não expira**. Se a pessoa mandou comprovante, a cota é dela até você conferir.

---

## 3. Concorrência — o coração do sistema

Duas pessoas clicando ao mesmo tempo é o cenário que quebra tudo. Dois padrões:

### 3.1 COTAS — função atômica com lock de linha

```sql
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
    raise exception 'COTAS_INSUFICIENTES';   -- <- trate esse erro na UI
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
```

### 3.2 LINK — update condicional (mais simples, igualmente seguro)

```sql
create or replace function reserve_link(
  p_gift_id uuid, p_guest_id uuid, p_message text
) returns claims
language plpgsql as $$
declare v_claim claims; v_rows int;
begin
  -- Só muda se AINDA estiver disponível. Quem chegar depois pega 0 linhas.
  update gifts set status = 'RESERVADO'
   where id = p_gift_id and type = 'LINK' and status = 'DISPONIVEL';
  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    raise exception 'JA_RESERVADO';   -- <- trate esse erro na UI
  end if;

  insert into claims (gift_id, guest_id, status, message)
  values (p_gift_id, p_guest_id, 'RESERVADO', p_message)
  returning * into v_claim;

  return v_claim;
end; $$;
```

### 3.3 Expiração (cron a cada 5 min)

```sql
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
```

### 3.4 Teste obrigatório
Abra o mesmo presente em **dois celulares** e clique em reservar no mesmo instante. Só um pode passar. Se os dois passarem, **não publique o site.**

---

## 4. Fluxos do convidado

```
[/]  Home
     Nomes, data, foto, contagem regressiva
     Botões: "Lista de presentes" | "Ver recados"
     ↓
[/presentes]  Lista
     Filtros: Todos | Disponíveis | Categoria
     Cards: foto, título, valor, barra de progresso (COTAS), selo "Presenteado 💝" (CONCLUIDO)
     ↓
[/presentes/[id]]  Detalhe → 3 caminhos:

  ┌─ LINK ──────────────────────────────────────────────────────┐
  │ "Quero dar este presente"                                   │
  │  → Modal: Nome + WhatsApp + recadinho                       │
  │  → reserve_link()                                           │
  │  → Sucesso: "Reservado pra você!" + botão "Ir para a loja"  │
  │  → Trata erro JA_RESERVADO: "Alguém foi mais rápido 😅"      │
  └─────────────────────────────────────────────────────────────┘

  ┌─ COTAS ─────────────────────────────────────────────────────┐
  │ Barra: "7 de 24 cotas · R$ 875 de R$ 3.000"                 │
  │ Seletor: [− 1 +] cotas = R$ 125,00                          │
  │  → Modal: Nome + WhatsApp + recadinho                       │
  │  → reserve_shares()  ⏱ reserva vale 60 min                  │
  └───────────────────────────┬─────────────────────────────────┘
                              │
  ┌─ LIVRE ────────────────┐  │
  │ Campo de valor          │  │
  │ Sugestões: 50/100/200   │  │
  │ (mín. R$ 20)            │  │
  │  → cria claim direto    │  │
  └───────────┬─────────────┘  │
              └───────┬────────┘
                      ▼
        [/pagamento/[claimId]]  ← tela única, serve COTAS e LIVRE
              • QR Code + botão "Copiar código PIX"
              • Valor em destaque
              • Cronômetro (só COTAS): "Reservado por 59:12"
              • Campo obrigatório: "Nome de quem fez o PIX"
              • Upload do comprovante  → status EM_ANALISE
                      ▼
        [/obrigado]  "Recebemos! Vamos confirmar e te avisar ❤️"
                     + acesso aos recados e à lista de presentes

[/confirmar]   REMOVIDA — confirmação de presença acontece em outra plataforma
[/meus]        lê guest_token do localStorage → mostra o que a pessoa reservou/pagou
[/recados]     Mural: claims.message + registros históricos, só os aprovados
[/nos]         História do casal / local / trajes  (estático, zero backend)
```

---

## 5. PIX — QR Code estático (BR Code / EMV)

O "copia e cola" é uma string no padrão **EMV QRCPS-MPM**: campos TLV + CRC16-CCITT no final.

- Use lib pronta (`pix-utils` ou equivalente em TS). **Não escreva o CRC na mão.**
- Preencha: chave PIX, **valor fixo** (campo `54` — evita o convidado errar), nome e cidade do recebedor (sem acento, maiúsculas), e o **`txid`** do claim no campo `62`.
- ⚠️ **Valide o código gerado abrindo no app do seu banco antes de publicar.** CRC errado = QR recusado.
- ⚠️ **O PIX estático não identifica o pagador.** Pode aparecer o nome da esposa, do filho, de qualquer um. Por isso `payer_name` e o comprovante são obrigatórios.

---

## 6. Painel admin (`/admin`)

Supabase Auth, email + senha, só seu. Middleware protegendo a rota.

1. **Dashboard** — total arrecadado, presentes concluídos, **nº de pendências** (o número que importa).
2. **Fila de confirmação** ⭐ a tela mais usada — claims `EM_ANALISE`: nome, valor, preview do comprovante (signed URL), botões **Confirmar** / **Rejeitar**.
3. **Presentes** — CRUD, upload de imagem, ocultar, liberar reserva presa.
4. **Convidados / RSVP** — lista, contagem de confirmados + acompanhantes, export CSV.
5. **Moderação de recados** — aprovar/reprovar `message` e `rsvp_notes` para o mural.
6. **Lançamento manual** — registrar um presente/PIX recebido fora do site.

---

## 7. Segurança

- **RLS:**
  - `gifts` → `SELECT` público (esconder `OCULTO`); escrita só admin.
  - `guests`, `claims` → **sem acesso público, nenhum.** Tudo por Server Action com `service_role`.
  - Mural: view pública que expõe **só** `name` + `message` dos aprovados. Nunca telefone.
- **Storage:** bucket de comprovantes **privado**. Admin acessa por signed URL.
- **Rate limit** no endpoint de reserva (~5/min por IP). Sem isso, alguém trava sua lista inteira de brincadeira.
- **LGPD:** você coleta nome e telefone. Explique o uso numa linha, não compartilhe, apague depois do casamento.
- Chave PIX **no servidor**, nunca em campo editável no front.

---

## 8. Roadmap por sessão (retomável entre embarques)

Cada sessão termina com o `CLAUDE.md` atualizado e o código no ar.

| Sessão | Objetivo | "Pronto" quando... |
|---|---|---|
| **0** | **Ambiente.** Node, Git, GitHub, Claude Code, conta Supabase, conta Vercel. Next.js "hello world" **deployado**. | você abre o `.vercel.app` no celular e vê a página |
| **1** | Schema completo + RLS + as 3 funções SQL + seed de 8 presentes fake | você roda `reserve_shares` no SQL Editor e vê o contador subir |
| **2** | Home + lista + detalhe (só leitura). Deploy. | lista real aparece no celular |
| **3** | Fluxo LINK completo (modal, `reserve_link`, guest_token, tela de sucesso) | você reserva de dois celulares e um recebe `JA_RESERVADO` |
| **4** | COTAS + LIVRE + tela de PIX + QR + upload de comprovante | você paga R$ 1,00 pra si mesmo lendo o QR do site |
| **5** | Admin: auth, fila de confirmação, CRUD de presentes | você aprova o pagamento da sessão 4 |
| **6** | RSVP + `/meus` + mural + moderação | fluxo de ponta a ponta funciona |
| **7** | Cron de expiração + rate limit + revisão de RLS | você tenta ler `claims` com a anon key e falha |
| **8** | Visual, fotos reais, textos, contagem regressiva, `/nos` | parece um site de casamento, não um CRUD |
| **9** | Testes finais + checklist | pronto pra mandar no grupo da família |
| *(10)* | *Opcional: trocar confirmação manual por PSP com webhook* | |

---

## 9. Armadilhas

| Armadilha | Efeito | Prevenção |
|---|---|---|
| `float` em dinheiro | R$ 74,999999 | `integer`, centavos |
| `SELECT` + `UPDATE` separados | vende cota a mais | funções da seção 3 |
| Sem cron de expiração | lista trava com reservas fantasma | sessão 7 |
| Reserva de LINK sem cobrança | presente "some" e ninguém compra | botão de liberar no admin + lembrete no WhatsApp |
| PIX sem `txid` / sem `payer_name` | você não sabe quem pagou | ambos obrigatórios |
| Cronômetro com `setTimeout` no client | some ao recarregar | derive de `expires_at` do banco |
| Site pesado | metade abre no browser do WhatsApp, 4G | `next/image`, WebP, Lighthouse > 90 |
| RSVP obrigatório antes do presente | perde presentes | RSVP é convite, não portão |
| Escrita pública anônima no mural | spam de cassino | mural só exibe o que foi aprovado |
| Testar sozinho | bug de concorrência aparece no dia | 2 dispositivos, sempre |

---

## 10. Checklist final

- [ ] QR PIX testado no app do banco (valor e nome corretos)
- [ ] Reserva simultânea em 2 celulares → só um passa
- [ ] Testado no navegador interno do WhatsApp (iOS **e** Android)
- [ ] RLS: tentei ler `claims` com a anon key e falhou
- [ ] Cron de expiração rodando
- [ ] Nenhum telefone de convidado vaza no mural / na API pública
- [ ] Carrega em < 3s no 4G
- [ ] Texto explicando cota, em 2 frases, na própria lista
- [ ] Seu WhatsApp visível pra quem tiver dúvida
- [ ] **Uma pessoa de 60+ anos usou sozinha, sem ajuda** (o teste que vale ouro)

---

## Apêndice — catálogo sugerido (22 presentes)

**Dimensionamento:** *unidades presenteáveis ≥ nº de famílias convidadas.*

| Tipo | Qtd | Faixa | Exemplos |
|---|---|---|---|
| LINK | 14 | R$ 60–250 | jogo de toalhas, air fryer, panelas, jogo de cama, liquidificador, aparelho de jantar… |
| COTAS | 6 | R$ 800–3.500 | geladeira, sofá, máquina de lavar, lua de mel, TV, cama box |
| LIVRE | 2 | aberto | "Presente livre", "Ajude na lua de mel" |

**Regras de cota:** valor entre **R$ 50 e R$ 150**; **8 a 30 cotas** por presente.
Ex.: R$ 3.000 → **24 cotas de R$ 125** ✅ · R$ 3.000 → 60 cotas de R$ 50 ❌ (parece inalcançável)

**Copy dos títulos:** humano, não catálogo.
"Nossa primeira air fryer 🍟" ✅ · "Fritadeira Elétrica 5L Inox" ❌

**Texto explicando cota (coloque no topo da lista):**
> *Alguns presentes são caros demais pra uma pessoa só — então dividimos em cotas. Você escolhe quantas quer dar e paga por PIX. Quando todas forem preenchidas, ele é nosso! 💝*
