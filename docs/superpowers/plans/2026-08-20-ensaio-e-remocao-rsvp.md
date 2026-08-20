# Ensaio e remoção do RSVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar o ensaio e a inspiração visual à experiência one-page e retirar o RSVP da área pública sem apagar dados administrativos.

**Architecture:** Os arquivos selecionados serão normalizados em `public/images` e descritos por um módulo tipado. Server Components puros renderizarão a capa, o bloco de inspiração e a galeria com `next/image`; as páginas públicas perderão todos os consumidores do RSVP, enquanto o modelo administrativo permanece intacto.

**Tech Stack:** Next.js 16.2.12 App Router, React 19 Server Components, TypeScript, CSS, `next/image` e Vitest com `react-dom/server`.

**Spec:** `docs/superpowers/specs/2026-08-20-ensaio-e-remocao-rsvp-design.md`

## Global Constraints

- Manter a navegação principal baseada nas seções da home.
- Remover completamente a confirmação de presença da experiência pública.
- Preservar dados, tabelas e telas administrativas históricas do RSVP.
- Usar as três fotos principais na estrutura e todas as restantes na galeria.
- Identificar as referências como inspiração, não como fotografias do local.
- Aplicar a nova paleta com contenção e manter as fontes existentes.
- Não adicionar dependências.
- Validar em 390×844 e 1440×900 sem overflow horizontal.

---

### Task 1: Contrato público e acervo fotográfico

**Files:**
- Modify: `src/lib/site-navigation.test.ts`
- Create: `src/components/WeddingGallery.test.tsx`
- Create: `src/content/wedding-photos.ts`
- Create: `src/components/WeddingGallery.tsx`
- Create: `src/components/WeddingInspiration.tsx`
- Copy: `Fotos ensaio/*.jpg` to `public/images/ensaio/*.jpg`
- Copy: selected inspiration photos to `public/images/inspiracao/*.jpg`

**Interfaces:**
- Produces: `WEDDING_GALLERY: readonly WeddingPhoto[]`
- Produces: `WEDDING_INSPIRATION: readonly WeddingPhoto[]`
- Produces: `WeddingGallery(): React.JSX.Element`
- Produces: `WeddingInspiration(): React.JSX.Element`

- [x] **Step 1: Escrever os testes falhando**

Alterar o teste de navegação para esperar somente:

```ts
[
  { label: "Nós", href: "/#nos" },
  { label: "Presentes", href: "/#presentes" },
  { label: "Recados", href: "/#recados" },
  { label: "Meus", href: "/meus" },
]
```

Criar um teste que renderiza `<WeddingGallery />` e exige dez figuras, a legenda
“Essa também somos nós.” e textos alternativos não vazios.

- [x] **Step 2: Confirmar a falha correta**

Run: `node node_modules/vitest/vitest.mjs run src/lib/site-navigation.test.ts src/components/WeddingGallery.test.tsx`

Expected: FAIL pela presença do item `Presença` e pela ausência do componente.

- [x] **Step 3: Importar e descrever as imagens**

Normalizar os nomes em `public/images/ensaio` e `public/images/inspiracao`.
Definir `WeddingPhoto` com `src`, `alt`, `width`, `height`, `orientation` e
`playful?`. Preencher a galeria com os nove arquivos `_MG_` e `Foto engraçada`.

- [x] **Step 4: Criar os componentes fotográficos**

`WeddingGallery` renderiza uma seção `#galeria` com dez `<figure>` e imagens
otimizadas. `WeddingInspiration` renderiza quatro referências escolhidas sob o
título “Nossa inspiração”.

- [x] **Step 5: Confirmar os testes verdes**

Run: `node node_modules/vitest/vitest.mjs run src/lib/site-navigation.test.ts src/components/WeddingGallery.test.tsx`

Expected: PASS.

---

### Task 2: Composição one-page e retirada do RSVP

**Files:**
- Modify: `src/lib/site-navigation.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/components/CoupleStorySection.tsx`
- Modify: `src/components/CoupleStorySection.test.tsx`
- Modify: `src/app/nos/page.tsx`
- Modify: `src/app/recados/page.tsx`
- Modify: `src/app/obrigado/page.tsx`
- Modify: `src/app/layout.tsx`
- Delete: `src/app/confirmar/page.tsx`
- Delete: `src/components/RsvpForm.tsx`

**Interfaces:**
- Consumes: `WeddingGallery()` and `WeddingInspiration()`
- Preserves: `CoupleStorySection({ id?: string })`

- [x] **Step 1: Testar o novo retrato da história**

Adicionar ao teste de `CoupleStorySection` a exigência da imagem
`/images/ensaio/principal-3.jpg` com texto alternativo descritivo e confirmar a
falha pela ausência do retrato.

- [x] **Step 2: Integrar as fotos principais e as novas seções**

Usar `principal-1.jpg` na capa, `principal-3.jpg` na história e
`principal-2.jpg` em uma transição fotográfica. Inserir inspiração antes dos
presentes e galeria antes de recados.

- [x] **Step 3: Remover todos os caminhos públicos do RSVP**

Retirar seção, menu, CTAs e textos de presença. Substituir ações secundárias por
links para `/#recados`, `/recados`, `/presentes` ou `/`, conforme o contexto.
Excluir a página e o formulário públicos sem alterar admin ou banco.

- [x] **Step 4: Confirmar testes de componente e navegação**

Run: `node node_modules/vitest/vitest.mjs run src/components/CoupleStorySection.test.tsx src/lib/site-navigation.test.ts src/components/WeddingGallery.test.tsx`

Expected: PASS.

---

### Task 3: Identidade visual, documentação e publicação

**Files:**
- Modify: `src/app/globals.css`
- Modify: `CLAUDE.md`
- Modify: `ESPECIFICACAO.md`

**Interfaces:**
- Consumes: classes estruturais das Tasks 1 e 2.

- [x] **Step 1: Aplicar a composição responsiva**

Atualizar os tokens marsala para granada/ameixa, adicionar verde e oliva, criar
estilos de capa fotográfica, retrato da história, inspiração e galeria, e remover
estilos públicos sem consumidores do bloco `.home-rsvp`.

- [x] **Step 2: Atualizar a memória do projeto**

Registrar a retirada pública do RSVP e a nova estrutura fotográfica, preservando
o histórico da fase S6 como contexto técnico.

- [x] **Step 3: Executar a verificação completa**

Run: `npm test`, `npm run lint`, `npx tsc --noEmit`, `git diff --check` e `npm run build`.

Expected: todos com exit code 0.

- [x] **Step 4: Fazer QA visual e publicar**

Abrir a home em 1440×900 e 390×844, validar capa, história, inspiração, galeria,
recados e ausência de links de RSVP. Depois, commitar, enviar `main`, aguardar a
Vercel e repetir a verificação na URL pública.
