# S8 — Visual, conteúdo e página “Nós” — Design

## Contexto e decisão já aprovada

A direção visual escolhida pelo casal é a **A — editorial romântico**: marfim,
marsala dos ternos, fios dourados, Cormorant Garamond para títulos e Jost para
texto. A S8 aprofunda essa linguagem; não troca a identidade já validada.

Foram considerados três caminhos:

1. **Convite editorial vivo (escolhido):** a home funciona como a capa de um
   convite e a página `/nos` como suas páginas internas. É específico para o
   casamento, leve no 4G e consistente com a direção A.
2. **Álbum fotográfico:** fotos grandes dominariam todas as rotas. Depende de um
   ensaio do casal que ainda não existe no repositório e produziria uma página
   incompleta agora.
3. **Landing page minimalista:** manteria quase toda a estrutura atual. É segura,
   mas não cumpre o objetivo de deixar de parecer um CRUD.

## Assunto, público e trabalho de cada página

- **Assunto:** o casamento de Carol e Denys, em um domingo na Casa do Lago.
- **Público:** familiares e amigos, muitos abrindo pelo navegador do WhatsApp em
  um celular e conexão 4G.
- **Home:** emocionar, situar data/local e levar rapidamente a presentes ou RSVP.
- **`/nos`:** reunir, sem inventar fatos pessoais, a intenção da celebração,
  informações do local e os próximos passos do convidado.

## Sistema visual

### Cores

- **Marfim — `#FBF7F0`:** papel principal.
- **Papel — `#FFFFFF`:** cartões e superfícies de leitura.
- **Tinta — `#2A2320`:** texto.
- **Marsala — `#964F4C`:** ações e assinatura do casal.
- **Marsala profundo — `#6E393A`:** títulos e contraste.
- **Dourado envelhecido — `#C0A050`:** fios, datas e pequenos marcos.
- **Areia — `#EFE6D6`:** planos do lago, bordas e fundos.

### Tipografia

- **Display:** Cormorant Garamond 400/500/600, normal e itálico.
- **Corpo e utilidade:** Jost 300/400/500.
- Não adicionar uma terceira fonte: cada arquivo extra aumenta o custo no 4G.

### Layout

Home:

```text
┌──────────────── convite/capa ────────────────┐
│ data fina              monograma vertical    │
│              Carol                          │
│                &                            │
│              Denys      lago em camadas     │
│     [presentes] [confirmar presença]         │
└──────────────────────────────────────────────┘
┌── um domingo para guardar ──┬── 31 / 01 ────┐
│ texto curto e verdadeiro     │ Casa do Lago  │
└──────────────────────────────┴───────────────┘
┌──────── três presentes reais do catálogo ────┐
└───────────────────────────────────────────────┘
```

Página `/nos`:

```text
┌── título editorial amplo ───┬── arco/lago ───┐
├──────── texto da celebração em duas colunas ─┤
├── quando ─────── onde ───────── endereço ─────┤
├── mapa / rota ───────────── próximos passos ──┤
└───────────────────────────────────────────────┘
```

## Elemento-assinatura

O elemento memorável será o **arco da Casa do Lago refletido em três linhas de
água**, desenhado em CSS/SVG e usado apenas nos dois momentos principais: hero da
home e abertura de `/nos`. É uma referência concreta ao local, sem depender de
uma fotografia genérica e sem espalhar ornamentos por toda a interface.

## Conteúdo

O texto não inventa como o casal se conheceu, datas de namoro, profissão,
preferências ou dress code. A narrativa se limita ao que é conhecido:

- Carol e Denys vão se casar.
- A celebração será em 31 de janeiro de 2027, às 16h.
- O local é Casa do Lago, Costazul, Rio das Ostras/RJ.
- O endereço é R. Beija-flor, Costazul, Rio das Ostras/RJ, 28895-048.
- O encontro foi preparado para reunir pessoas importantes para o casal.

O mapa abre o endereço no Google Maps em uma nova aba. Presentes e RSVP continuam
como caminhos independentes.

## Fotografias

Não há arquivos de foto do casal no repositório. A S8 não fabricará rostos nem
apresentará banco de imagens como se fosse pessoal. Os presentes continuam
exibindo as fotos reais cadastradas pelo admin e otimizadas por `next/image`.

A estrutura aceitará posteriormente:

- `public/images/carol-denys-hero.webp` — horizontal, recomendado 1800×1200;
- `public/images/carol-denys-nos.webp` — vertical, recomendado 1200×1600.

Quando os originais forem entregues, deverão ser convertidos para WebP e mantidos
abaixo de 350 KB cada. A ausência desses arquivos não gera área vazia nem 404.

## Componentes e fronteiras

- `src/lib/countdown.ts`: cálculo puro e testável da diferença até a cerimônia.
- `src/components/Countdown.tsx`: relógio cliente; apenas renderiza o cálculo.
- `src/components/LakeMark.tsx`: ilustração vetorial decorativa, sem estado.
- `src/app/page.tsx`: composição da home e leitura do catálogo.
- `src/app/nos/page.tsx`: página estática, sem backend.
- `src/app/globals.css`: tokens, layouts responsivos, foco e movimento reduzido.
- `src/app/layout.tsx`: navegação e metadados globais.

## Acessibilidade e performance

- Foco visível em links, botões e campos.
- Respeitar `prefers-reduced-motion`.
- SVG decorativo com `aria-hidden`.
- Apenas a contagem regressiva hidrata no cliente.
- Sem biblioteca de animação, mapa incorporado ou nova dependência.
- Fotos futuras usarão import estático/`next/image`, reservando proporção e
  evitando layout shift.
- A home preserva os CTAs principais acima da dobra em celular.

## Testes e aceite

- Testes unitários do cálculo antes, durante e depois da cerimônia.
- Suite atual, ESLint, TypeScript e build sem erros.
- Revisão visual em 390×844 e 1440×900.
- Navegação por teclado com foco visível.
- `/`, `/nos`, `/presentes`, `/confirmar` e `/recados` sem overflow horizontal.
- Site publicado na Vercel e validado no domínio principal.

