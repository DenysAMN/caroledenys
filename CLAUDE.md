# CLAUDE.md — Site de Casamento

> Arquivo de memória do projeto. Fica na **raiz do repositório**.
> O Claude Code lê isso automaticamente ao abrir a sessão.
> **Ao final de toda sessão, atualize a seção "Estado atual".**

---

## Sobre o dono do projeto

Sou técnico de equipamentos offshore, formação em Engenharia Elétrica. Trabalho com
Power BI / Power Automate / Power Apps — ou seja, entendo **lógica, dados e fluxos**,
mas **nunca fiz desenvolvimento web**. Não conheço as convenções do ecossistema JS.

**Como falar comigo:**
- Explique *por que*, não só *o que*. Prefiro entender a copiar.
- Quando usar um termo novo do mundo web (hydration, server action, middleware...), defina em uma linha.
- Não presuma que eu sei configurar ambiente. Me dê o comando exato.
- Se algo pode quebrar em produção mas não local, me avise ANTES.
- Sou intercalado por embarques: posso sumir por semanas. Sempre deixe o próximo passo escrito.

**Analogias que funcionam pra mim:**
`tabela Supabase ≈ lista do SharePoint` · `RLS ≈ permissões da lista` ·
`Server Action ≈ fluxo do Power Automate` · `função Postgres ≈ ação com lógica, mas atômica de verdade`

---

## O projeto

Site de lista de presentes + confirmação de presença para o meu casamento.
Especificação completa: **`ESPECIFICACAO.md`** (leia antes de codar qualquer coisa).

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth + Storage) · Vercel

**Três tipos de presente:**
- `LINK` — convidado reserva e compra na loja por conta própria
- `COTAS` — presente caro dividido em N cotas, pago por PIX
- `LIVRE` — valor aberto, pago por PIX

**PIX:** chave estática, confirmação **manual** pelo painel (convidado envia comprovante).
Preparado para migrar pra PSP com webhook depois.

---

## REGRAS INVIOLÁVEIS

1. **Dinheiro em centavos, tipo `integer`.** Nunca float. `R$ 125,00` = `12500`.
2. **Reserva de cota/link SEMPRE via função atômica no Postgres.** Nunca `SELECT` → checar → `UPDATE` no app.
3. **`guests` e `claims` nunca são lidos pelo navegador.** Só Server Action com `service_role`. Essa key nunca sai do servidor.
4. **RLS ligado em toda tabela, desde a migração.**
5. **Confirmação de pagamento é UMA função:** `confirmarPagamento(claimId)`. Hoje: botão do admin. Amanhã: webhook. Não espalhe.
6. **Mobile-first.** A maioria abre no navegador do WhatsApp, no 4G.
7. **Nenhum telefone de convidado pode vazar** em API pública, no mural, em lugar nenhum.
8. **Sem escrita pública anônima.** Mural só mostra o que foi aprovado no painel.
9. **`timestamptz` (UTC) no banco.** Converte só na exibição.
10. **RSVP nunca é pré-requisito pra dar presente.**

---

## Comandos

```bash
npm run dev          # http://localhost:3000
npm run build        # sempre rodar antes de dar push
npx supabase db push # aplica migrações
```

---

## Estado atual

**Sessão concluída:** S0 — ambiente montado e "hello world" no ar.

**Infra (links importantes):**
- Repositório: https://github.com/DenysAMN/caroledenys (privado)
- Site no ar: https://caroledenys.vercel.app (deploy automático a cada push na branch `main`)
- Chave PIX (do dono): `denysaugusto2015@gmail.com` — entra como variável de ambiente no servidor na S4, NUNCA no código versionado.
- Identidade do Git configurada só neste repo (`--local`): Denys Augusto / denysaugusto2015@gmail.com

**Próximo passo:** Sessão 1 — Supabase. Criar conta + projeto no Supabase, escrever a
migração com o schema completo (seção 2 da ESPECIFICACAO.md) + RLS + as 3 funções SQL
(`reserve_shares`, `reserve_link`, `expire_stale_claims`) + seed de ~8 presentes fake.
"Pronto" quando: rodar `reserve_shares` no SQL Editor e ver o contador de cotas subir.

**Feito:**
- [x] S0 — Ambiente + deploy vazio
- [ ] S1 — Schema + RLS + funções SQL + seed
- [ ] S2 — Home, lista, detalhe (leitura)
- [ ] S3 — Fluxo LINK
- [ ] S4 — COTAS + LIVRE + PIX
- [ ] S5 — Admin + fila de confirmação
- [ ] S6 — RSVP + /meus + mural
- [ ] S7 — Cron + rate limit + revisão de RLS
- [ ] S8 — Visual, fotos, textos
- [ ] S9 — Testes finais

**Decisões pendentes:** nenhuma

**Pontos de atenção abertos:**
- Validar o payload do QR PIX abrindo no app do banco antes de publicar
- Testar reserva simultânea em 2 celulares antes de publicar

---

## Ao terminar cada sessão

1. `npm run build` passa sem erro
2. Commit + push (deploy automático na Vercel)
3. **Atualize a seção "Estado atual" acima** — próximo passo, checkboxes, pendências
