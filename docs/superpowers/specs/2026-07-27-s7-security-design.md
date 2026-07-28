# S7 Expiração, rate limit e RLS — Design aprovado

## Escopo

Impedir que reservas PIX abandonadas travem cotas, limitar abuso automatizado das
três ações de reserva e provar que as superfícies públicas do banco continuam
expondo somente o que foi deliberadamente publicado.

Este documento concretiza a S7 já aprovada em `ESPECIFICACAO.md`.

## Abordagens consideradas

### Expiração

1. **Supabase Cron / pg_cron (escolhida).** Executa a função Postgres existente a
   cada cinco minutos, sem chamada HTTP, chave externa ou conta adicional.
2. Vercel Cron. Exigiria uma rota autenticada e dependeria dos limites do plano da
   hospedagem.
3. Expirar quando alguém abre a lista. Não garante execução quando não há tráfego.

### Rate limit

1. **Contador atômico no Postgres (escolhido).** Funciona entre todas as instâncias
   da Vercel e reutiliza o Supabase já contratado.
2. Contador em memória. Cada função serverless teria um contador diferente e ele
   sumiria em reinicializações.
3. Serviço Redis externo. Robusto, mas adicionaria conta e infraestrutura sem
   necessidade para a escala do casamento.

## Arquitetura

### Expiração

`expire_stale_claims()` permanece a única fonte de verdade. A função muda
`AGUARDANDO_PAGAMENTO` vencido para `EXPIRADO` e devolve as cotas ao presente na
mesma transação. Um job `expire-stale-claims`, registrado com expressão
`*/5 * * * *`, chama a função diretamente no banco.

O job também remove contadores de rate limit inativos há mais de sete dias. Isso
mantém a tabela pequena sem guardar histórico de navegação.

### Rate limit

As Server Actions leem `x-vercel-forwarded-for`, caindo para `x-forwarded-for` e
`x-real-ip`. O valor é validado como IPv4/IPv6 e transformado em HMAC-SHA256 com a
chave secreta já existente. O banco recebe apenas um hash hexadecimal de 64
caracteres.

`consume_reservation_rate_limit(hash, 5, 60)` faz `insert ... on conflict do
update` e devolve `true` nas cinco primeiras tentativas da janela e `false` nas
seguintes. LINK, COTAS e LIVRE compartilham a mesma janela global. Entradas
inválidas são rejeitadas antes de consumir a cota do limite.

Quando bloqueado, o formulário mostra uma mensagem amigável para aguardar um
minuto. Nenhum convidado ou claim é criado.

### Endurecimento SQL

- `guests`, `claims` e `reservation_rate_limits` ficam com RLS ativo e sem
  políticas para `anon` ou `authenticated`.
- Funções de reserva, pagamento, expiração, rate limit e auditoria têm grants
  explícitos; funções internas são executáveis somente por `service_role`.
- `gifts` mantém somente leitura pública de registros não ocultos.
- `public_messages` continua sendo a única projeção pública de dados de
  convidados e expõe apenas nome, mensagem, origem e data aprovados.

## Erros e privacidade

IP inválido ou ausente usa uma chave de fallback por implantação e ainda passa
pelo mesmo limite; em produção a Vercel fornece o IP público. Nenhum IP puro é
gravado, retornado à interface ou incluído em logs.

Falha no serviço de rate limit fecha a reserva com erro genérico em vez de liberar
abuso silenciosamente.

## Testes e pronto

- Testes unitários cobrem seleção/validação do IP, HMAC e mensagem de bloqueio.
- Teste integrado prova as cinco permissões e o sexto bloqueio, expiração com
  devolução de cotas, job agendado e negação de leitura/escrita/RPC anônima.
- S7 está pronta quando migração, auditoria, build e UAT de bloqueio passam em
  produção.
