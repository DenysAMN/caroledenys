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

Site de casamento com história, ensaio, lista de presentes e livro de recados.
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
10. **RSVP público foi aposentado.** Dados históricos e telas administrativas permanecem; não reexpor o formulário sem nova decisão explícita.

---

## Comandos

```bash
npm run dev          # http://localhost:3000
npm run build        # sempre rodar antes de dar push
npx supabase db push # aplica migrações
```

---

## Estado atual

**Atualização de 27/09/2026 — localização:** endereço detalhado na home e em
`/nos`: Rua Beija-flor, Bairro Costazul, Rio das Ostras — RJ, CEP 28895-048.
Mapa Google incorporado com carregamento tardio e botão “Como chegar” que abre
rotas no Google Maps. A capa também tem atalho para `#local`. Não foi inventado
número de imóvel nem coordenadas: mapa e rota usam o nome e endereço fornecidos.
Validação desta mudança: testes, lint e build no ambiente online; sem variáveis
do Supabase, catálogo e recados ficam vazios nesse build. Produção deve ser
verificada após publicar o commit; banco e pagamentos não foram testados.

**Sessão concluída:** fotos do ensaio e referências visuais integradas à home,
paleta refinada e RSVP retirado completamente da experiência pública. Deploy
validado em `https://caroledenys.vercel.app`.

**Visual travado:** Direção A — editorial romântico. Fontes `Cormorant Garamond` (display)
+ `Jost` (corpo). Paleta refinada com granada `#7A1E33`, ameixa `#532337`,
vinho `#5A1F30`, verde profundo `#435525`, oliva `#4F5A32`, marfim `#FBF7F0`
e fios dourados. Tokens em `src/app/globals.css`. Casamento: **31/01/2027, 15h30**,
Casa do Lago, Rio das Ostras/RJ.

**Navegação pública:** o menu principal rola para as seções `#nos`, `#presentes`
e `#recados` da home, além da área `/meus`. A rota `/confirmar` e todos os CTAs
públicos de RSVP foram removidos; `/recados` permanece como mural completo.

**Continuidade online:** preparação em `docs/CLOUD_HANDOFF.md`. A tarefa
ChatGPT criada com um resumo não substitui um ambiente Codex Cloud configurado.
A migração ainda depende de autenticar/configurar esse ambiente e verificar
checkout, testes e publicação nele. Não afirmar que as credenciais locais
foram transferidas. `AGENTS.md` aponta para os documentos de continuidade.

**Infra (links importantes):**
- Repositório: https://github.com/DenysAMN/caroledenys (público em 27/09/2026;
  o usuário tornou público para contornar uma falha de leitura no conector)
- Site no ar: https://caroledenys.vercel.app (deploy automático a cada push na branch `main`)
- Supabase: projeto `caroledenys`, ref `fmkgkpsxzmgnhnsnspdp`, região São Paulo. Migração em `supabase/migrations/`.
- **Env vars** (em `.env.local`, gitignored):
  - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key `sb_publishable_...`) — leitura pública.
  - `SUPABASE_SERVICE_ROLE_KEY` (secret key `sb_secret_...`) — SÓ servidor, sem `NEXT_PUBLIC_`. Usada nas Server Actions p/ escrever em guests/claims.
  - `ADMIN_EMAIL` — único e-mail autorizado no painel dos noivos.
  - ⚠️ Todas precisam estar TAMBÉM na Vercel (Settings > Environment Variables). A `service_role`/`secret` na Vercel NÃO pode ter `NEXT_PUBLIC_` no nome.
- Chave PIX do dono: configurada somente em `PIX_KEY` no ambiente do servidor,
  nunca no código versionado.
- Identidade do Git configurada só neste repo (`--local`): Denys Augusto / denysaugusto2015@gmail.com

**Próximo passo:** Sessão 9 — testes finais, concorrência em dois aparelhos,
auditoria de performance e checklist para enviar o site aos convidados. Fazer
também a aprovação visual final das fotos em celulares reais.

**S5 entregue:** `/admin` usa Supabase Auth SSR e permite conferir pagamentos,
confirmar/rejeitar PIX, consultar métricas e administrar presentes. As funções
`confirm_payment` e `reject_payment` são atômicas e exclusivas da `service_role`;
imagens do catálogo ficam no bucket público `gift-images` com limite de 4 MB.

**S6 entregue (histórico):** `/confirmar` registrava ou atualizava RSVP usando o token local;
`/meus` reconstrói o histórico e o acesso à tela PIX; `/recados` lê exclusivamente
a view segura `public_messages`. O admin possui lista de convidados, métricas,
exportação CSV e moderação sem apagar o texto original. O teste integrado
`npm run test:s6-integration` prova que a anon key não lê `guests`/`claims` e que
telefone e token não aparecem no mural.

Em 20/08/2026, o formulário e a rota pública de RSVP foram aposentados porque a
confirmação passou para outra plataforma. Dados antigos e administração foram
preservados para não apagar histórico.

**S7 entregue:** Supabase Cron executa `expire_stale_claims()` a cada 5 minutos;
reservas LINK/COTAS/LIVRE compartilham limite de 5 tentativas por IP a cada 60
segundos. O IP é transformado em HMAC antes de chegar ao banco. RPCs internas têm
grants exclusivos da `service_role`; `guests`, `claims` e
`reservation_rate_limits` permanecem sem acesso público. O teste
`npm run test:s7-integration` valida cron, expiração, devolução de cotas, bloqueio
da sexta tentativa e negação anônima de leitura, escrita e execução.

**S8 entregue:** a home agora funciona como capa de convite, com assinatura
vetorial inspirada no arco e no lago do local; `/nos` reúne celebração, data,
endereço e rota do mapa sem inventar fatos pessoais. A contagem regressiva usa
cálculo puro coberto por testes, os metadados seguem um template único e as rotas
públicas foram auditadas em 390×844 e 1440×900. As fotos do catálogo continuam
vindo do admin com `next/image`. O menu editorial e os botões da capa rolam pela
home; catálogo, mural completo e `/meus` continuam em páginas próprias.

**Ensaio integrado:** `principal-1` abre a home, `principal-3` acompanha a
história e `principal-2` cria a transição para a galeria. As dez fotos restantes
formam `#galeria`; quatro referências aparecem identificadas como “Nossa
inspiração”. A foto engraçada encerra o álbum com tratamento próprio. O build
otimiza o carregamento por `next/image`, e as pastas originais permanecem fora
do Git.

**História dos noivos:** `#nos` apresenta os relatos integrais de Carol e Denys
como duas cartas conectadas pela cronologia de 06/09/2025, 07/10/2025 e
31/01/2027. O conteúdo estruturado e o componente são compartilhados com `/nos`,
sem abas, acordeões ou JavaScript cliente.

**Padrão de reserva (LINK):** componente cliente
(`LinkReserveButton`) fica SEMPRE montado e decide o estado local, para o sucesso
sobreviver à revalidação. Server Action em `src/app/actions/`, admin client em
`src/lib/supabaseAdmin.ts`.

**Feito:**
- [x] S0 — Ambiente + deploy vazio
- [x] S1 — Schema + RLS + funções SQL + seed
- [x] S2 — Home, lista, detalhe (leitura)
- [x] S3 — Fluxo LINK
- [x] S4 — COTAS + LIVRE + PIX
- [x] S5 — Admin + fila de confirmação
- [x] S6 — RSVP + /meus + mural
- [x] S7 — Cron + rate limit + revisão de RLS
- [x] S8 — Visual, fotos, textos
- [ ] S9 — Testes finais

**Decisões pendentes:** nenhuma

**Pontos de atenção abertos:**
- Testar reserva simultânea em 2 celulares antes de publicar para os convidados.
- Comprimir os originais do ensaio se a auditoria final de performance indicar necessidade.

---

## Ao terminar cada sessão

1. `npm run build` passa sem erro
2. Commit + push (deploy automático na Vercel)
3. **Atualize a seção "Estado atual" acima** — próximo passo, checkboxes, pendências
