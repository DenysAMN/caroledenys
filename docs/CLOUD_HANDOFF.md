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

O conector GitHub retornava 404 quando o repositório era privado. A leitura foi
confirmada após ele ser tornado público. A causa do acesso privado não está
comprovada. Ler um repositório público e receber metadados de permissão `push`
não comprova que o ambiente de trabalho consegue publicar alterações.
Não recomendar novamente tornar o repositório público como configuração.

## Configurar o ambiente correto

Em https://chatgpt.com/codex/settings/environments, criar ou selecionar um
ambiente Codex Cloud ligado a `DenysAMN/caroledenys`. A conexão do plugin GitHub
de uma conversa e o checkout autenticado do ambiente devem ser verificados
separadamente. Não criar outra conversa genérica para simular essa configuração.

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
- [ ] O checkout e a branch selecionada foram conferidos.
- [ ] Dependências instaladas; testes, lint e build executados na nuvem.
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

Handoff direto de um chat local para Codex Cloud não é suportado. A continuidade
usa uma nova tarefa no ambiente correto e os documentos do projeto.
