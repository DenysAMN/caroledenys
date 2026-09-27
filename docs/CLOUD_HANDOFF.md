# Continuidade online — Carol e Denys

## Situação da migração em 27/09/2026

A tarefa ChatGPT “Aguardar customização do site” recebeu um resumo do projeto.
Isso não criou um ambiente Codex Cloud vinculado ao repositório, não transferiu
o histórico completo e não transferiu credenciais locais. A migração ainda não
foi validada de ponta a ponta.

Repositório: https://github.com/DenysAMN/caroledenys
Produção: https://caroledenys.vercel.app/
Branch de produção: `main`, com publicação automática pela Vercel.
Última alteração funcional nesta preparação: `7664a58`, horário para 15h30.

O conector GitHub retornava 404 quando o repositório era privado. Após a
instalação/autorização concluída pelo usuário em 27/09/2026, a busca de
repositórios instalados passou a retornar `DenysAMN/caroledenys`, confirmado
nesta tarefa. A antiga lista vazia não descreve mais a conexão atual.
O repositório continua público nesta verificação; o acesso a ESTE repositório
privado ainda precisa ser comprovado. Não recomendar torná-lo público nem
repetir reconexões sem evidência. A escrita concreta está registrada abaixo.

## Ambiente desta tarefa e opção Codex Cloud

Esta tarefa já executa código em Cloud Work, sem depender do computador local.
Isso não cria um ambiente Codex Cloud com ENV_ID. Se esse ambiente específico
for desejado, sua configuração é separada em
https://chatgpt.com/codex/settings/environments. A leitura pelo Git e a escrita
autenticada pelo plugin são verificações distintas; não presumir credenciais
Git locais a partir do funcionamento do plugin.

Usar Node.js 22 e o lockfile versionado. Script de instalação:

```sh
npm ci
```

Os comandos de verificação do projeto são:

```sh
npm test
npm run lint
npm run build
```

O build usa Google Fonts: precisa conseguir obter as fontes de
`fonts.googleapis.com` e `fonts.gstatic.com`. O catálogo e os recados usam
Supabase. Verificar a rede do ambiente se essas operações falharem.

## Variáveis e credenciais

Os nomes necessários estão em `.env.example`; os valores reais não estão no
Git. `.env.local` e `.vercel/` são ignorados. Não publicar esses arquivos ou
colar valores secretos em mensagens, commits, capturas ou registros de comando.

Para visualizar dados públicos, configurar `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY` no ambiente. O projeto Supabase tem ref
`fmkgkpsxzmgnhnsnspdp`. Sem essas variáveis, a prévia pode ter catálogo vazio;
um build que passa assim não valida a integração com o banco.

As funções administrativas, reservas e pagamentos precisam de configuração
server-side adicional: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `PIX_KEY`,
`PIX_MERCHANT_NAME` e `PIX_MERCHANT_CITY`. Elas já existem na instalação local e
na Vercel, mas sua presença no ambiente online não foi verificada. A chave
`sb_secret_...` é válida no nome legado `SUPABASE_SERVICE_ROLE_KEY` usado pelo
código; não renomear a variável apenas por ela não ser uma chave legacy.

Credenciais da Vercel e Supabase não são necessárias para publicar uma mudança
somente de código quando o fluxo GitHub → Vercel está funcionando. Não conceder
acesso de escrita ao banco de produção apenas para validar o setup. Os testes
`test:s5-integration`, `test:s6-integration` e `test:s7-integration` precisam de
variáveis reais e podem escrever no banco: não executá-los automaticamente na
produção como parte da migração.

## Critérios para considerar a migração concluída

- [ ] A tarefa roda em um ambiente Codex Cloud associado ao repositório.
- [x] O checkout de main em `cc65563` e a branch remota `codex/cloud-validation` foram conferidos.
- [x] Dependências instaladas; testes, lint e build executados nesta tarefa Cloud Work.
- [ ] A leitura autenticada do repositório privado foi validada, se privado.
- [ ] O envio de uma alteração de documentação em branch própria ou PR foi
      comprovado; acesso público de leitura não satisfaz este item.
- [ ] As variáveis públicas foram configuradas para visualizar o catálogo.
- [ ] O fluxo de publicação foi confirmado no painel/commit de deploy da Vercel
      e a URL pública foi conferida após uma alteração aprovada.
- [ ] O usuário consegue abrir e continuar a tarefa pelo celular.

Itens não verificados devem permanecer abertos; não afirmar “100% migrado”.
Mudanças futuras podem usar branch e PR, com merge em `main` para produção.
Não fazer mudanças fictícias no site apenas para testar publicação.


## Validação executada nesta tarefa Cloud Work — 27/09/2026

Validação feita no ambiente online desta conversa, sem usar o computador local.
Não foi criado ENV_ID nem transferido automaticamente o histórico da tarefa
local. Foram lidos no GitHub AGENTS.md, CLAUDE.md, ESPECIFICACAO.md e este documento.

### Código e comandos

- Checkout atualizado de `origin/main`: `cc65563c33d3e9deb230bd7fd5aa6d34a6f770b1`.
- Diretório de execução: `/workspace/scratch/aaa887a7ab05/caroledenys`.
- O runtime padrão tinha Node 24; os comandos abaixo usaram Node **22.23.3**
  e npm **10.9.9**, selecionados por
  `npx --yes --package=node@22 --package=npm@10 -c '<comando>'`.
- `npm ci`: sucesso, código de saída 0, 444 pacotes instalados.
- `npm test`: sucesso, código de saída 0, **81 testes em 17 arquivos**.
- `npm run lint`: sucesso, código de saída 0, sem diagnósticos do ESLint.
- `npm run build`: sucesso, código de saída 0, Next.js 16.2.12/Turbopack,
  TypeScript concluído e 11 páginas estáticas geradas.
- Houve avisos do ambiente sobre `http-proxy` e `EnvHttpProxyAgent`
  experimental; não impediram os comandos.
- O código e o lockfile permaneceram sem alterações após a execução.

### Escrita autenticada

A integração GitHub criou a branch `codex/cloud-validation` a partir do SHA
acima. A publicação desta seção nessa branch registra uma alteração real de
documentação pelo conector, sem depender apenas de `permissions.push=true`.
Somente `docs/CLOUD_HANDOFF.md` deve mudar; o PR deve ter base `main` e
permanecer aberto, sem merge. O Git de leitura usou o repositório público;
push autenticado por linha de comando não foi testado.

### Limites e pendências

Nenhuma das sete variáveis listadas em `.env.example` estava configurada no
processo e não havia `.env.local`. Portanto, **o build utilizou catálogo e
recados vazios**, conforme o retorno de listas vazias em `gifts.ts` e
`public-messages.ts` quando o Supabase não está configurado.
Esse sucesso não valida banco, autenticação administrativa, reservas, PIX,
comprovantes, RLS ou pagamentos.

Não foram executados `test:s5-integration`, `test:s6-integration` ou
`test:s7-integration`, nem realizadas escritas no banco de produção.
Nenhum segredo foi solicitado ou copiado. Acesso privado a este repositório,
configuração de credenciais, deploy de produção e migração integral do
histórico continuam sem validação nesta tarefa. Não foi feito merge.
Um eventual preview automático da Vercel não equivale a validar produção.

### Continuação no celular

Abrir esta mesma conversa/tarefa na mesma conta e projeto Casamento pelo
celular e enviar a próxima customização. O trabalho aqui usa o ambiente online
e a integração GitHub, sem exigir o computador local ligado. A retomada efetiva
no celular ainda deve ser confirmada pelo usuário. O checkout temporário pode
precisar ser reconstruído; a documentação e os commits no GitHub são a
referência persistente. Nenhuma ferramenta específica para anexar PR à tarefa
foi exposta nesta sessão; o link do PR será entregue na conversa.

## Decisões que a continuação deve preservar

- Casamento em 31/01/2027 às 15h30, Casa do Lago, Costazul, Rio das Ostras/RJ.
- Home predominantemente de página única: navegação por rolagem e âncoras.
- RSVP público removido: `/confirmar` não deve reaparecer. Histórico e admin
  permanecem; Recados é uma seção/menu independente.
- PIX confirmado manualmente pelos noivos. O recebimento do dinheiro é o
  critério; não implementar análise do conteúdo da foto do comprovante.
- Admin compartilhado pelo casal; não criar dois acessos sem nova solicitação.
- Histórias dos noivos completas, com português corrigido e voz preservada.
- Direção editorial romântica, Cormorant Garamond/Jost e paleta já aprovada.
- Fotos prontas em `public/images/`; originais locais não foram transferidos.
- Valores monetários em centavos, reservas atômicas e dados privados somente
  pelo servidor; seguir os contratos já documentados.

O próximo trabalho funcional pendente é S9 (testes finais), além das próximas
customizações pedidas pelo usuário. Não executar S9 sem solicitação durante a
preparação do ambiente. Falar em português, executar com autonomia e agrupar
as perguntas que realmente impedem a execução.

## Referências oficiais

- https://learn.chatgpt.com/docs/cloud
- https://learn.chatgpt.com/docs/environments/cloud-environment
- https://learn.chatgpt.com/docs/remote-connections

Não houve handoff automático local → Codex Cloud. A continuidade desta tarefa
Cloud Work usa os documentos versionados e o contexto fornecido pelo usuário;
um ambiente Codex Cloud separado continua não criado.
