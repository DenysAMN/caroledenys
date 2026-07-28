# Correção S8 — Navegação one-page — Design

## Problema

O header publicado na S8 transformou os itens principais em rotas independentes:
`/nos`, `/presentes`, `/confirmar` e `/recados`. Essa decisão não foi validada e
contraria a experiência desejada: conhecer o casamento deve parecer a leitura
contínua de um convite, rolando a mesma página.

## Abordagens consideradas

1. **Home editorial com seções + rotas somente para ações (escolhida).**
   O menu rola para `#nos`, `#presentes`, `#presenca` e `#recados`. Dentro das
   seções, CTAs abrem catálogo completo, formulário RSVP e mural completo.
   “Meus” continua separado porque é uma área pessoal, não conteúdo do convite.
2. **Colocar todos os fluxos completos na home.**
   Catálogo, detalhes, pagamento, RSVP e histórico ficariam na mesma rota. Isso
   deixaria a página pesada, confundiria o histórico do navegador e misturaria
   conteúdo editorial com tarefas transacionais.
3. **Trocar apenas os links, sem criar as seções ausentes.**
   Seria rápido, mas “Presença” e “Recados” não teriam destinos reais e a home
   continuaria incompleta.

## Contrato de navegação

| Item do header | Destino principal | Ação interna da seção |
| --- | --- | --- |
| Nós | `/#nos` | continua rolando para os detalhes |
| Presentes | `/#presentes` | “Ver todos” abre `/presentes` |
| Presença | `/#presenca` | “Confirmar presença” abre `/confirmar` |
| Recados | `/#recados` | “Ler todos” abre `/recados` |
| Meus | `/meus` | área pessoal permanece separada |

Ao clicar no menu a partir de outra rota, o visitante volta para a home já na
seção correta. O logo continua levando ao início.

## Estrutura da home

```text
#inicio      capa, data, contagem e ações rápidas
   ↓
#nos         intenção da celebração + data/local
   ↓
#presentes   explicação + 3 presentes reais + catálogo completo
   ↓
#presenca    convite para RSVP + resumo de data/local
   ↓
#recados     até 2 mensagens aprovadas + mural completo
```

As rotas existentes não serão removidas: elas continuam sendo necessárias para
executar tarefas completas e para links já compartilhados. A mudança está na
arquitetura de descoberta, não nos fluxos.

## Dados e segurança

- A home continua lendo presentes pela função pública segura já existente.
- A prévia de recados usa `getPublicMessages()`, que lê somente a view moderada e
  não expõe telefone ou token.
- Presentes e recados são buscados em paralelo.
- Nenhuma Server Action, tabela, policy ou fluxo PIX será alterado.

## Acessibilidade e comportamento

- Cada seção possui `id` estável e heading próprio.
- `html` usa `scroll-padding-top` para compensar o header sticky.
- `scroll-behavior: smooth` continua respeitando `prefers-reduced-motion`.
- O destino do hash recebe posição correta sem ficar escondido pelo menu.
- Se não houver presentes ou recados, a seção continua existindo com estado
  vazio; nenhum link do header aponta para um elemento ausente.

## Aceite

- Na home, clicar nos quatro itens editoriais mantém `pathname === "/"` e muda o
  hash/posição.
- Em `/presentes`, clicar “Nós” navega para `/#nos`.
- “Meus” continua abrindo `/meus`.
- CTAs internos continuam abrindo `/presentes`, `/confirmar` e `/recados`.
- Sem overflow em 390×844 e sem regressões na suite/build.

