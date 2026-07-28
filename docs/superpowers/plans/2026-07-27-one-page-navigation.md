# Correção de Navegação One-Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o menu principal rolar pelas seções editoriais da home, mantendo páginas separadas somente para fluxos completos e área pessoal.

**Architecture:** Os destinos do header ficam centralizados em uma configuração testável. A home ganha seções permanentes para Nós, Presentes, Presença e Recados, buscando presentes e mensagens moderadas em paralelo. As rotas atuais permanecem disponíveis como destinos dos CTAs internos.

**Tech Stack:** Next.js 16.2.12 App Router, React 19, TypeScript, CSS, Vitest, Supabase.

## Global Constraints

- O menu editorial deve usar `/#hash`, não rotas de conteúdo.
- “Meus” permanece `/meus`.
- Catálogo, RSVP e mural completos permanecem em suas rotas atuais.
- Não alterar backend, RLS, PIX, reservas ou autenticação.
- Seções de hash nunca podem desaparecer por falta de dados.
- Compensar o header sticky com `scroll-padding-top`.

---

### Task 1: Contrato testável do menu

**Files:**
- Create: `src/lib/site-navigation.test.ts`
- Create: `src/lib/site-navigation.ts`
- Modify: `src/app/layout.tsx`

- [x] Escrever teste que exige `/#nos`, `/#presentes`, `/#presenca`,
  `/#recados` e `/meus`.
- [x] Executar o teste e confirmar falha por módulo ausente.
- [x] Implementar `PRIMARY_NAV_ITEMS` e renderizá-lo no header.
- [x] Executar teste focado e confirmar passagem.

### Task 2: Seções permanentes da home

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [x] Adicionar `id="inicio"` à capa e `id="nos"` à seção de introdução.
- [x] Renderizar `#presentes` mesmo sem itens e preservar o CTA `/presentes`.
- [x] Criar `#presenca` com resumo do convite e CTA `/confirmar`.
- [x] Criar `#recados` com até duas mensagens moderadas e CTA `/recados`.
- [x] Buscar presentes e recados em paralelo.
- [x] Trocar o link `/nos` da home por rolagem interna.

### Task 3: Rolagem, verificação e publicação

**Files:**
- Modify: `src/app/globals.css`
- Modify: `CLAUDE.md`

- [x] Configurar o offset de rolagem com `scroll-padding-top`.
- [x] Rodar suite, lint, TypeScript e build.
- [x] Testar hashes na home e retorno de uma rota funcional.
- [x] Auditar 390×844 e 1440×900.
- [x] Atualizar memória e preparar a publicação.
