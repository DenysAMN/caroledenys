# S5 Admin — Design aprovado

## Escopo

Construir `/admin` como painel privado para Carol e Denys, usando um único login
compartilhado (`denysaugusto2015@gmail.com`). A S5 entrega autenticação, dashboard,
fila de comprovantes e CRUD completo de presentes.

## Abordagens consideradas

1. **Supabase Auth com sessão SSR e `proxy.ts` (escolhida).** Reaproveita a
   infraestrutura existente, mantém a sessão em cookies e permite autorização
   novamente em cada Server Action.
2. **Senha fixa em variável de ambiente.** Menos arquivos, mas exigiria construir e
   auditar nossa própria sessão; rejeitada por segurança.
3. **Provedor externo de identidade.** Robusto, porém desnecessário para um único
   acesso compartilhado.

## Arquitetura

- `@supabase/ssr` gerencia a sessão em cookies.
- `proxy.ts` renova tokens e protege `/admin`, exceto `/admin/login`.
- `requireAdmin()` valida usuário e e-mail permitido dentro de toda leitura ou
  mutação administrativa; a proteção da rota não substitui essa autorização.
- O `service_role` continua sendo o único cliente que lê/escreve `guests`, `claims`
  e presentes administrativos.
- Duas funções Postgres fazem transições atômicas: `confirm_payment` e
  `reject_payment`.

## Fluxos

### Login

O casal entra com o e-mail permitido e uma senha criada no Supabase Auth. Não haverá
cadastro público. Login válido abre o dashboard; sair apaga a sessão.

### Fila de confirmação

A fila mostra somente `EM_ANALISE`, em ordem de chegada, com convidado, nome do
pagador, presente, valor, TXID e comprovante por URL assinada curta. **Confirmar**
muda para `PAGO` e preenche `paid_at`. **Rejeitar** cancela imediatamente; em COTAS,
devolve as cotas ao presente na mesma transação. O arquivo rejeitado é apagado do
bucket depois da transição.

A foto é apoio visual, não prova autoritativa. A decisão é feita conferindo se o PIX
caiu no banco, conforme orientação do dono do projeto.

### Dashboard

Mostra três números operacionais: total pago, comprovantes pendentes e presentes
concluídos. A fila aparece logo abaixo porque é a tarefa mais frequente.

### Presentes

Lista todos os presentes, inclusive ocultos. Permite criar, editar, excluir, ocultar
e reordenar LINK, COTAS e LIVRE. O formulário aceita imagem JPG, PNG ou WebP de até
4 MB. As imagens ficam no bucket público `gift-images`; toda escrita ocorre no
servidor autenticado. Conforme decisão do dono, campos financeiros permanecem
editáveis mesmo depois de reservas.

## Design visual

O painel mantém Cormorant Garamond, Jost, marfim e marsala para parecer parte do
casamento, mas adota uma composição de **livro-caixa**: coluna lateral estreita,
linhas douradas e números alinhados, sem gradientes ou cartões genéricos. A assinatura
visual é a fila tratada como páginas de conferência, com o comprovante como documento
central. Em celular, a navegação vira uma faixa horizontal e os registros empilham.

## Erros e segurança

- Todas as ações validam autenticação, e-mail permitido, UUIDs e campos do presente.
- Login nunca revela se o e-mail existe.
- URLs de comprovantes expiram em 10 minutos.
- Confirmação/rejeição repetida retorna conflito sem duplicar efeitos.
- Chaves secretas nunca entram no cliente ou no Git.

## Testes e pronto

- Testes unitários cobrem autorização, validação de presentes e regras de transição.
- Teste integrado cria claims temporários para confirmar e rejeitar, verificando a
  devolução de cotas e limpando os dados.
- Login, dashboard, fila e CRUD são verificados em desktop e celular.
- S5 está pronta quando o pagamento da S4 pode ser aprovado pelo painel e um presente
  pode ser criado/editado com imagem.
