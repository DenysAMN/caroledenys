# Ensaio, inspiração e remoção do RSVP — Design

## Objetivo

Transformar a home em uma experiência mais pessoal e fotográfica usando o ensaio
de Carol e Denys, incorporar a atmosfera visual escolhida para a celebração e
retirar completamente a confirmação de presença da experiência pública. O livro
de recados permanece como seção própria da home e item do menu.

## Direção visual

O site continua sendo um convite editorial de uma página, agora com fotografias
reais como fio condutor. A `Foto principal 1` abre a experiência; a `Foto
principal 3` acompanha os relatos; a `Foto principal 2` cria uma transição em
movimento; e as demais imagens formam uma galeria responsiva.

As referências de decoração aparecem sob o título **Nossa inspiração**, nunca
como fotografias reais da Casa do Lago. A paleta é aplicada com contenção:

- Vinho: `#5A1F30`
- Granada: `#7A1E33`
- Ameixa: `#532337`
- Verde profundo: `#435525`
- Oliva: `#4F5A32`
- Marfim existente: `#FBF7F0`

As fontes Cormorant Garamond e Jost são preservadas. A assinatura visual é o
encerramento da galeria com a foto engraçada levemente inclinada e a legenda
“Essa também somos nós.”; o restante da composição permanece reto e disciplinado.

## Estrutura da home

1. Capa fotográfica com data, local, contagem regressiva e acesso aos presentes.
2. História completa dos noivos com um retrato do ensaio.
3. Bloco **Nossa inspiração** com referências de mesa e flores.
4. Lista de presentes.
5. Galeria **Nosso ensaio**, com todas as fotos não usadas como destaques.
6. Recados para os noivos.

As fotografias usam `next/image`, dimensões intrínsecas e carregamento tardio,
exceto a imagem principal da capa, que recebe prioridade.

## Remoção pública do RSVP

- Remover “Presença” do menu e todos os CTAs públicos de confirmação.
- Remover a seção `#presenca` da home.
- Excluir a rota pública `/confirmar` e o formulário público correspondente.
- Atualizar `/nos`, `/recados`, `/obrigado` e metadados para não mencionar RSVP.
- Manter as tabelas, registros históricos, validações e telas administrativas de
  convidados; não haverá migração destrutiva no Supabase.
- O menu público fica: **Nós**, **Presentes**, **Recados**, **Meus**.

## Responsividade e acessibilidade

- A capa mantém o casal visível em 390 px e em telas largas via `object-position`.
- A galeria alterna retratos e paisagens no desktop e vira uma coluna no celular.
- Todas as imagens possuem texto alternativo descritivo.
- Foco visível e `prefers-reduced-motion` continuam respeitados.
- Nenhuma imagem ou transformação provoca rolagem horizontal.

## Aceitação

- Não existe link, texto, seção ou rota pública de confirmação de presença.
- Recados continua acessível pelo menu e pela seção `#recados`.
- As três fotos principais têm função estrutural própria.
- Todas as demais fotos do ensaio aparecem na galeria.
- As referências são identificadas claramente como inspiração.
- O site passa em testes, lint, TypeScript e build, e é revisado em desktop e
  celular antes da publicação.
