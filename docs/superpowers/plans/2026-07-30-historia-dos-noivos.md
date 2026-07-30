# História dos noivos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar os relatos integrais de Carol e Denys como duas cartas editoriais conectadas por uma linha do tempo na home e em `/nos`.

**Architecture:** O texto aprovado fica em um módulo de conteúdo tipado. Um Server Component puro renderiza os dois relatos e os três marcos cronológicos; home e `/nos` reutilizam esse componente. O CSS existente recebe a composição responsiva e perde somente os estilos genéricos substituídos.

**Tech Stack:** Next.js 16.2.12 App Router, React 19 Server Components, TypeScript, CSS e Vitest com `react-dom/server`.

## Global Constraints

- Publicar os dois textos completos da especificação, apenas com as correções aprovadas.
- Preservar humor, emojis, “Hummm”, “Será?”, “moooonte”, “óbvio” e “kkkkkk”.
- Manter a seção na home em `#nos` e reutilizá-la em `/nos`.
- Não usar abas, acordeões, botões ou JavaScript cliente para esconder/revelar texto.
- Preservar a paleta marsala, marfim e dourado e as fontes atuais.
- Não alterar presentes, RSVP, recados, PIX, Supabase ou autenticação.
- Validar sem overflow em 390 px e com leitura confortável em 390×844 e 1440×900.

---

### Task 1: Conteúdo tipado e componente de cartas

**Files:**
- Create: `src/content/couple-story.ts`
- Create: `src/components/CoupleStorySection.tsx`
- Test: `src/components/CoupleStorySection.test.tsx`

**Interfaces:**
- Produces: `COUPLE_STORIES: readonly CoupleStory[]`
- Produces: `COUPLE_MILESTONES: readonly CoupleMilestone[]`
- Produces: `CoupleStorySection({ id?: string }): React.JSX.Element`

- [x] **Step 1: Escrever o teste falhando**

Renderizar `<CoupleStorySection id="nos" />` com `renderToStaticMarkup` e exigir:

```tsx
expect(html).toContain('id="nos"');
expect(html).toContain("Pelo olhar do noivo");
expect(html).toContain("Pelo olhar da noiva");
expect(html).toContain("06 SET 2025");
expect(html).toContain("07 OUT 2025");
expect(html).toContain("31 JAN 2027");
expect(html).toContain("Hummm, bonita");
expect(html).toContain("moooonte de amigos");
expect(html).toContain("Para o homem que mudou a profecia");
expect(html.match(/<article/g)).toHaveLength(2);
expect(html).not.toContain("<button");
```

- [x] **Step 2: Confirmar a falha correta**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/components/CoupleStorySection.test.tsx
```

Expected: FAIL porque `CoupleStorySection` ainda não existe.

- [x] **Step 3: Criar o modelo e inserir o conteúdo aprovado**

Definir:

```ts
export type CoupleStorySection = {
  heading?: string;
  paragraphs: readonly string[];
};

export type CoupleStory = {
  id: "noivo" | "noiva";
  perspective: string;
  author: "Denys" | "Carol";
  sections: readonly CoupleStorySection[];
};

export type CoupleMilestone = {
  dateTime: string;
  dateLabel: string;
  label: string;
};
```

Preencher `COUPLE_STORIES` com o conteúdo exato de “Conteúdo aprovado” em
`docs/superpowers/specs/2026-07-30-historia-dos-noivos-design.md`.

Preencher `COUPLE_MILESTONES` com:

```ts
[
  { dateTime: "2025-09-06", dateLabel: "06 SET 2025", label: "A primeira mensagem" },
  { dateTime: "2025-10-07", dateLabel: "07 OUT 2025", label: "O pedido de namoro" },
  { dateTime: "2027-01-31", dateLabel: "31 JAN 2027", label: "O nosso sim" },
]
```

- [x] **Step 4: Criar o Server Component**

Renderizar:

```tsx
<section id={id} className="couple-story">
  <div className="container">
    <header className="couple-story-intro">
      <p className="eyebrow">Nossa história</p>
      <h2>A mesma história, dois olhares.</h2>
      <p>Antes do nosso sim, vieram uma mensagem, alguns stories e duas versões de um encontro que mudou tudo.</p>
    </header>
    <ol className="couple-timeline" aria-label="Linha do tempo do relacionamento">
      {COUPLE_MILESTONES.map((milestone) => (
        <li key={milestone.dateTime}>
          <time dateTime={milestone.dateTime}>{milestone.dateLabel}</time>
          <span>{milestone.label}</span>
        </li>
      ))}
    </ol>
    <div className="couple-letters">
      {COUPLE_STORIES.map((story, index) => (
        <article
          key={story.id}
          className={`couple-letter couple-letter-${story.id}`}
        >
          <header className="couple-letter-header">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{story.perspective}</p>
          </header>
          <div className="couple-letter-body">
            {story.sections.map((storySection) => (
              <section key={storySection.heading ?? storySection.paragraphs[0]}>
                {storySection.heading && <h3>{storySection.heading}</h3>}
                {storySection.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
          <footer>
            <span>Com amor,</span>
            <strong>{story.author}</strong>
          </footer>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [x] **Step 5: Confirmar o teste verde**

Run:

```bash
node node_modules/vitest/vitest.mjs run src/components/CoupleStorySection.test.tsx
```

Expected: PASS.

---

### Task 2: Integrar a história na home e em `/nos`

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/nos/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `CoupleStorySection({ id?: string })`

- [x] **Step 1: Trocar a introdução genérica da home**

Remover o bloco `.home-intro` e renderizar:

```tsx
<CoupleStorySection id="nos" />
```

entre a capa e `#presentes`.

- [x] **Step 2: Trocar o relato genérico de `/nos`**

Remover a seção `.nos-story` e renderizar:

```tsx
<CoupleStorySection />
```

entre a hero da rota e os dados da Casa do Lago.

- [x] **Step 3: Aplicar a composição editorial**

Criar estilos para:

- `.couple-story` e `.couple-story-intro`;
- `.couple-timeline`, com fio dourado e três marcos reais;
- `.couple-letters`;
- `.couple-letter`, alternando alinhamento no desktop;
- `.couple-letter-header`, `.couple-letter-body`, subtítulos e assinatura;
- breakpoint de 900 px para limitar largura e de 580 px para coluna única.

Remover os estilos sem consumidores de `.home-intro`, `.home-date-card` e
`.nos-story`.

- [x] **Step 4: Verificar o conjunto**

Run:

```bash
node node_modules/vitest/vitest.mjs run
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
git diff --check
node node_modules/next/dist/bin/next build
```

Expected: todos com exit code 0.

---

### Task 3: QA, memória e publicação

**Files:**
- Modify: `CLAUDE.md`

- [x] **Step 1: Validar a experiência**

Em build de produção local:

- abrir `/#nos` em 1440×900 e 390×844;
- confirmar duas cartas, três marcos e ausência de overflow;
- confirmar que `/nos` mostra o mesmo conteúdo;
- confirmar que o menu “Nós” continua levando a `/#nos`.

- [x] **Step 2: Atualizar a memória**

Registrar em `CLAUDE.md` que `#nos` contém os relatos integrais e que o conteúdo
é compartilhado com `/nos`.

- [x] **Step 3: Commit e publicação**

```bash
git add docs/superpowers/plans/2026-07-30-historia-dos-noivos.md \
  src/content/couple-story.ts \
  src/components/CoupleStorySection.tsx \
  src/components/CoupleStorySection.test.tsx \
  src/app/page.tsx src/app/nos/page.tsx src/app/globals.css CLAUDE.md
git commit -m "feat: adiciona historia dos noivos"
git push origin main
```

Esperar a Vercel marcar o deploy como `Ready` e repetir a verificação de
`/#nos` em `https://caroledenys.vercel.app`.
