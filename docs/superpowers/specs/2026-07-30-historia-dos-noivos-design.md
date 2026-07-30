# História dos noivos — Design

## Objetivo

Substituir o texto genérico da seção `#nos` por uma narrativa pessoal e integral
do relacionamento de Carol e Denys. A história será apresentada pelos dois pontos
de vista, mantendo humor, referências pessoais, emojis e escolhas de linguagem
que dão identidade aos relatos.

O conteúdo deve permanecer disponível na home, seguindo a navegação one-page.
A rota `/nos` continuará acessível como página editorial complementar e usará o
mesmo conteúdo, sem manter uma versão genérica ou divergente da história.

## Direção editorial

Título da seção: **A mesma história, dois olhares.**

Os relatos serão tratados como duas cartas:

1. **Pelo olhar do noivo** — assinado por Denys.
2. **Pelo olhar da noiva** — assinado por Carol.

As correções ficam limitadas a ortografia, pontuação, concordância e fluidez.
Expressões como “Hummm”, “Será?”, “moooonte”, “óbvio”, “kkkkkk” e os emojis
permanecem porque fazem parte da voz de cada autor.

## Composição visual

- As cartas aparecem completas e em sequência, sem abas, acordeões ou texto
  escondido.
- Uma linha cronológica dourada conecta os marcos `06 SET 2025`,
  `07 OUT 2025` e `31 JAN 2027`.
- Cada carta tem largura de leitura controlada, margens amplas e tipografia
  editorial. O texto corrido usa Jost; títulos, destaques e assinatura usam
  Cormorant Garamond.
- No desktop, as cartas alternam discretamente o alinhamento dentro do container.
  No celular, ficam empilhadas em uma única coluna.
- A linha do tempo é o elemento de assinatura da seção. O restante permanece
  contido para não competir com os relatos.
- A paleta atual é preservada: marfim, papel, marsala e fios dourados.
- A seção respeita foco visível e `prefers-reduced-motion`; não exige JavaScript
  no cliente.

## Arquitetura

- Criar um módulo de conteúdo estruturado para os dois relatos e os três marcos.
- Criar um componente de servidor reutilizável para renderizar a seção.
- Usar o componente na home com `id="nos"`.
- Usar o mesmo componente na rota `/nos`, substituindo o texto genérico atual.
- Manter presentes, RSVP, recados, PIX, banco e autenticação inalterados.

## Conteúdo aprovado

### Pelo olhar do noivo

Tudo começou quando segui uma pessoa aleatória chamada Ana porque pensei que
fosse outra Ana que eu conhecia — na foto, o rosto estava longe. Com o tempo,
por acaso vi um story dessa tal de Ana... e percebi que não era a Ana que eu
imaginava. Daí pensei: “Hummm, bonita, mas não faço ideia de quem seja.”

Passou mais um tempo, percebi que ela tinha alguns interesses parecidos com os
meus e resolvi “investir”. Como? Da melhor forma possível: curtindo alguns
stories.

E claro que deu certo. Depois de um tempo, postei um dos meus raros stories e
ela curtiu o meu... Pensei: “Será?”

Postei outra coisa, ela curtiu de novo. Daí pensei: “É, acho que ela pode estar
interessada.”

Aproveitei um contexto em comum e mandei uma mensagem. Foi assim que começamos
a nos conhecer. Depois de uma ou duas semanas apenas curtindo stories,
conversamos de novo e, dessa vez, fui mais direto, sem contexto. O assunto foi
ficando mais pessoal, e comecei a perceber que ela era ainda mais parecida
comigo do que eu pensava. Assim, comecei a me apaixonar. Dormia e acordava
pensando nela, sempre tentando puxar assunto.

Ao mesmo tempo, o congresso estava chegando, e pensei que seria a oportunidade
certa. E foi! Fui ao congresso dela. Não conversamos muito a princípio (depois
descobri que foi porque ela ficou nervosa por ter me achado muito gato 😎), mas
marquei de irmos treinar na mesma semana. Ali surgiram muitas conversas legais,
e o interesse ficou claro dos dois lados.

No fim de semana seguinte era o meu congresso, e ela também foi. Para mim, ali
já estava certo: tudo dizia que valia a pena, e eu estava muito feliz. Então não
perdi tempo. Seguindo os princípios e vendo que o interesse mútuo era óbvio,
resolvi oficializar o namoro. Ela ficou chocada, mas aceitou (óbvio 😌) kkkkkk.

A partir desse dia, tudo mudou. Já conversávamos de forma muito mais leve e
tranquila e, conforme fomos nos conhecendo, só nos apaixonamos mais e mais.

E aqui estamos nós, noivos! Dessa decisão não vou me arrepender jamais. Você é
a pessoa com quem decidi passar a eternidade! Isso não é pouca coisa. Significa
que vou ser muito feliz e que vou fazer o meu máximo para te fazer ainda mais
feliz.

### Pelo olhar da noiva

#### 6 de setembro de 2025 — O início

Senti meu celular vibrar com uma mensagem: “É o pagode do Lucy que tocou para
vocês?” Nunca imaginaria que aquela mensagem seria o início da minha história
de amor com o amor da minha vida. Depois de conversarmos até as três horas da
manhã sobre todos os assuntos possíveis, eu ficava me perguntando: “Será?”

Mesmo depois de ele ter me chamado para treinar, de ter ido ao meu congresso e
ficado conversando comigo durante o intervalo inteiro, eu continuava me
perguntando se ele realmente estava interessado.

E, depois de alguns treinos juntos e algumas mensagens trocadas...

#### 7 de outubro de 2025

Ele me chamou para sairmos só nós dois porque queria conversar de forma mais
privada... e nós fomos com um moooonte de amigos, mas cada um se sentou em um
lugar do restaurante. Eu estava tão nervosa que não parava de falar por um
segundo. Então ele olhou no fundo dos meus olhos e perguntou: “Eu queria saber
se você gostaria de namorar comigo?”

Eu me lembro de que minha primeira reação foi: “Você não acha que precisamos
nos conhecer melhor primeiro?” E ele respondeu: “Não seria o namoro exatamente
para isso?”

Eu me lembro de ter pensado um pouco... Afinal, o que poderia acontecer?

Tenho certeza de que foi uma das melhores decisões que já tomei na vida. Todo
o carinho, a atenção, o respeito e o amor que recebi foram muito maiores do que
eu jamais imaginei receber. Todas as músicas da Taylor que eu nunca imaginei
ouvir pensando em alguém passaram a ser para ele — para o meu melhor amigo e
para o meu amor.

#### Para o homem que mudou a profecia

Passei tanto tempo acreditando que algumas histórias eram feitas apenas para
os outros, até que você apareceu e fez tudo mudar. Com você, descobri que alguns
encontros realmente acontecem uma única vez na vida e não deixam dúvidas de que
foram escritos pelo próprio Jeová. O que antes parecia um conto impossível se
transformou na nossa própria história de amor, construída com coragem, escolhas
e parceria. Você trouxe luz para os meus dias e me ensinou que o amor de verdade
não vive na incerteza, mas na tranquilidade de saber que encontrou o seu lar.
Mesmo quando o peso de ser sempre forte parecia maior do que eu podia suportar,
você me lembrou de que eu também podia descansar, sonhar e ser cuidada.

## Testes e aceitação

- Um teste de conteúdo garante os dois autores, a ordem dos relatos, os três
  marcos cronológicos e frases características de cada voz.
- A home contém uma única seção `#nos` com os dois relatos completos.
- A rota `/nos` reutiliza o mesmo componente e o mesmo conteúdo.
- O menu continua rolando para `/#nos`.
- Nenhum parágrafo fica escondido por interação.
- Não há overflow horizontal em 390 px.
- A leitura permanece confortável em 390×844 e 1440×900.
