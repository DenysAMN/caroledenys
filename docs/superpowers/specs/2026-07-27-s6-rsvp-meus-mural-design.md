# S6 RSVP, área do convidado e mural — Design aprovado

## Escopo

Entregar o fluxo de ponta a ponta do convidado depois da lista de presentes:
confirmação de presença em `/confirmar`, histórico pessoal em `/meus`, mural
moderado em `/recados` e as telas administrativas de convidados, exportação CSV
e moderação.

Este documento concretiza as decisões já travadas em `ESPECIFICACAO.md`. RSVP
continua opcional e nunca bloqueia a lista de presentes.

## Arquitetura

- `guests` e `claims` permanecem com RLS ligado e sem políticas públicas.
- Server Actions com `service_role` recebem o `guest_token` guardado no
  `localStorage`, validam UUIDs e devolvem somente os campos necessários.
- O telefone identifica e deduplica o convidado. Um registro existente só pode
  ser alterado quando o navegador apresenta o token correspondente; isso impede
  que alguém sobrescreva uma confirmação apenas conhecendo um número.
- O mural usa uma view pública de colunas mínimas (`name`, `message`, `source`,
  `created_at`) e inclui exclusivamente textos aprovados. Telefone, tokens e dados
  financeiros não fazem parte da view.
- Leituras e mutações administrativas chamam `requireAdmin()` e usam o cliente
  servidor com chave secreta.

## Fluxos

### Confirmação de presença

O convidado informa nome, WhatsApp, se irá, número de acompanhantes e uma
observação opcional. Ao confirmar, o navegador guarda o token retornado. Se o
mesmo WhatsApp já estiver cadastrado, a edição exige o token do mesmo navegador.
Toda observação nova volta para a fila de moderação.

O formulário explica em uma linha que nome e telefone serão usados apenas para
organizar o casamento e não serão publicados ou compartilhados.

### Meus presentes

`/meus` lê o token local, solicita ao servidor as reservas pertencentes ao
convidado e mostra presente, tipo, valor/cotas, data e situação. Para pagamentos
em andamento, o servidor gera novamente um token assinado por contribuição; o
cliente o salva antes de abrir a tela PIX. Sem token local, a página explica que
o histórico fica disponível no aparelho usado para reservar.

### Mural

`/recados` combina recados de presentes e observações de RSVP aprovados. A página
é um livro de visitas editorial, ordenado dos mais recentes para os mais antigos,
e nunca oferece escrita anônima direta.

### Administração

`/admin/convidados` exibe totais de confirmados, acompanhantes e recusas, além da
lista completa e exportação CSV autenticada. `/admin/recados` lista textos de
presentes e RSVP, permitindo aprovar ou ocultar sem apagar o conteúdo original.

## Direção visual

O público mantém Cormorant Garamond, Jost, marfim e marsala. O RSVP parece um
cartão-resposta de convite, com escolhas de presença marcadas como linhas
destacáveis. `/meus` usa a linguagem de conteúdo de envelope e `/recados` lembra
folhas de livro de visitas, com citações grandes e ritmo assimétrico. Não há
gradientes, painéis genéricos ou excesso de cartões.

O admin preserva o livro-caixa da S5: métricas tipográficas, linhas finas e
registros em formato de ledger. Em telas pequenas, tabelas viram blocos legíveis
sem exigir rolagem horizontal.

## Validação e pronto

- Testes unitários cobrem RSVP, UUIDs, status e CSV.
- Teste integrado prova que anônimo não lê `guests`/`claims`, lê somente mensagens
  aprovadas pela view e nunca recebe telefone.
- Fluxos públicos e administrativos são verificados em desktop e celular.
- S6 está pronta quando RSVP, `/meus`, mural e moderação funcionam no ambiente de
  produção e o CSV pode ser baixado pelo admin.
