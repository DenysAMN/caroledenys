# S6 RSVP, área do convidado e mural — Implementation Plan

**Goal:** Entregar RSVP, histórico pessoal, mural público moderado e gestão
administrativa de convidados e recados.

**Architecture:** Dados privados são acessados somente por Server Actions e Route
Handlers com `service_role`. A identidade sem login usa o token local já existente.
Uma view pública de projeção mínima expõe exclusivamente mensagens aprovadas.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase
Postgres/Auth, Vitest.

## Restrições globais

- RSVP nunca é pré-requisito para presentear.
- `guests` e `claims` continuam sem acesso público.
- Nenhum telefone ou token aparece no mural.
- Toda ação admin executa `requireAdmin()`.
- Toda entrada recebe validação e limite.
- A UI continua mobile-first e coerente com a identidade editorial existente.

### Task 1: Contratos puros e migração

**Files:**
- Create: `src/lib/rsvp-validation.ts`
- Create: `src/lib/rsvp-validation.test.ts`
- Create: `src/lib/guest-area-rules.ts`
- Create: `src/lib/guest-area-rules.test.ts`
- Create: `src/lib/admin-guest-rules.ts`
- Create: `src/lib/admin-guest-rules.test.ts`
- Create: `supabase/migrations/20260727000000_s6_guestbook.sql`

- [x] Escrever testes falhando para RSVP, UUID/status e CSV.
- [x] Implementar os parsers mínimos até os testes passarem.
- [x] Criar a view `public_messages` com apenas campos seguros e grants mínimos.
- [x] Garantir que textos vazios não entram no mural.

### Task 2: RSVP público

**Files:**
- Create: `src/app/actions/rsvp.ts`
- Create: `src/components/RsvpForm.tsx`
- Modify: `src/app/confirmar/page.tsx`
- Modify: `src/app/globals.css`

- [x] Implementar criação/atualização com deduplicação por telefone.
- [x] Exigir token correspondente para alterar convidado já cadastrado.
- [x] Resetar moderação quando a observação muda.
- [x] Salvar token no navegador e renderizar sucesso/erros acessíveis.

### Task 3: Meus presentes

**Files:**
- Create: `src/app/actions/meus-presentes.ts`
- Create: `src/components/MyGifts.tsx`
- Create: `src/app/meus/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [x] Buscar apenas contribuições pertencentes ao token.
- [x] Devolver DTO sem telefone ou token do banco.
- [x] Reemitir token de acesso assinado para pagamentos em andamento.
- [x] Mostrar estados vazio, carregando, erro e histórico.

### Task 4: Mural e moderação

**Files:**
- Create: `src/lib/public-messages.ts`
- Modify: `src/app/recados/page.tsx`
- Create: `src/lib/admin-messages.ts`
- Create: `src/app/admin/actions/messages.ts`
- Create: `src/components/AdminMessageActions.tsx`
- Create: `src/app/admin/recados/page.tsx`
- Modify: `src/components/AdminNav.tsx`
- Modify: `src/app/globals.css`

- [x] Renderizar apenas a view pública segura.
- [x] Listar recados de claims e RSVP no admin.
- [x] Aprovar/ocultar com autenticação e revalidação.
- [x] Verificar que alteração não apaga texto original.

### Task 5: Convidados, métricas e CSV

**Files:**
- Create: `src/lib/admin-guests.ts`
- Create: `src/app/admin/convidados/page.tsx`
- Create: `src/app/admin/convidados/exportar/route.ts`
- Modify: `src/components/AdminNav.tsx`
- Modify: `src/app/globals.css`

- [x] Consultar convidados e calcular confirmados + acompanhantes.
- [x] Renderizar lista responsiva.
- [x] Gerar CSV UTF-8 autenticado e com escaping correto.

### Task 6: Integração e entrega

**Files:**
- Create: `scripts/s6-integration.mjs`
- Modify: `package.json`
- Modify: `CLAUDE.md`

- [x] Aplicar a migração no Supabase.
- [x] Provar RLS privado e projeção pública segura com dados temporários.
- [x] Rodar testes, lint, tipos, build e `git diff --check`.
- [x] Fazer UAT público/admin em desktop e celular.
- [x] Atualizar documentação, commitar, fazer push e validar o deploy.
