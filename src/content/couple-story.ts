export type CoupleStorySection = {
  heading?: string;
  paragraphs: readonly string[];
};

export type CoupleStory = {
  id: "noivo" | "noiva";
  perspective: string;
  author: "Denys" | "Carol";
  sections: readonly CoupleStorySection[];
};

export type CoupleMilestone = {
  dateTime: string;
  dateLabel: string;
  label: string;
};

export const COUPLE_MILESTONES: readonly CoupleMilestone[] = [
  {
    dateTime: "2025-09-06",
    dateLabel: "06 SET 2025",
    label: "A primeira mensagem",
  },
  {
    dateTime: "2025-10-07",
    dateLabel: "07 OUT 2025",
    label: "O pedido de namoro",
  },
  {
    dateTime: "2027-01-31",
    dateLabel: "31 JAN 2027",
    label: "O nosso sim",
  },
];

export const COUPLE_STORIES: readonly CoupleStory[] = [
  {
    id: "noivo",
    perspective: "Pelo olhar do noivo",
    author: "Denys",
    sections: [
      {
        paragraphs: [
          "Tudo começou quando segui uma pessoa aleatória chamada Ana porque pensei que fosse outra Ana que eu conhecia — na foto, o rosto estava longe. Com o tempo, por acaso vi um story dessa tal de Ana... e percebi que não era a Ana que eu imaginava. Daí pensei: “Hummm, bonita, mas não faço ideia de quem seja.”",
          "Passou mais um tempo, percebi que ela tinha alguns interesses parecidos com os meus e resolvi “investir”. Como? Da melhor forma possível: curtindo alguns stories.",
          "E claro que deu certo. Depois de um tempo, postei um dos meus raros stories e ela curtiu o meu... Pensei: “Será?”",
          "Postei outra coisa, ela curtiu de novo. Daí pensei: “É, acho que ela pode estar interessada.”",
          "Aproveitei um contexto em comum e mandei uma mensagem. Foi assim que começamos a nos conhecer. Depois de uma ou duas semanas apenas curtindo stories, conversamos de novo e, dessa vez, fui mais direto, sem contexto. O assunto foi ficando mais pessoal, e comecei a perceber que ela era ainda mais parecida comigo do que eu pensava. Assim, comecei a me apaixonar. Dormia e acordava pensando nela, sempre tentando puxar assunto.",
          "Ao mesmo tempo, o congresso estava chegando, e pensei que seria a oportunidade certa. E foi! Fui ao congresso dela. Não conversamos muito a princípio (depois descobri que foi porque ela ficou nervosa por ter me achado muito gato 😎), mas marquei de irmos treinar na mesma semana. Ali surgiram muitas conversas legais, e o interesse ficou claro dos dois lados.",
          "No fim de semana seguinte era o meu congresso, e ela também foi. Para mim, ali já estava certo: tudo dizia que valia a pena, e eu estava muito feliz. Então não perdi tempo. Seguindo os princípios e vendo que o interesse mútuo era óbvio, resolvi oficializar o namoro. Ela ficou chocada, mas aceitou (óbvio 😌) kkkkkk.",
          "A partir desse dia, tudo mudou. Já conversávamos de forma muito mais leve e tranquila e, conforme fomos nos conhecendo, só nos apaixonamos mais e mais.",
          "E aqui estamos nós, noivos! Dessa decisão não vou me arrepender jamais. Você é a pessoa com quem decidi passar a eternidade! Isso não é pouca coisa. Significa que vou ser muito feliz e que vou fazer o meu máximo para te fazer ainda mais feliz.",
        ],
      },
    ],
  },
  {
    id: "noiva",
    perspective: "Pelo olhar da noiva",
    author: "Carol",
    sections: [
      {
        heading: "6 de setembro de 2025 — O início",
        paragraphs: [
          "Senti meu celular vibrar com uma mensagem: “É o pagode do Lucy que tocou para vocês?” Nunca imaginaria que aquela mensagem seria o início da minha história de amor com o amor da minha vida. Depois de conversarmos até as três horas da manhã sobre todos os assuntos possíveis, eu ficava me perguntando: “Será?”",
          "Mesmo depois de ele ter me chamado para treinar, de ter ido ao meu congresso e ficado conversando comigo durante o intervalo inteiro, eu continuava me perguntando se ele realmente estava interessado.",
          "E, depois de alguns treinos juntos e algumas mensagens trocadas...",
        ],
      },
      {
        heading: "7 de outubro de 2025",
        paragraphs: [
          "Ele me chamou para sairmos só nós dois porque queria conversar de forma mais privada... e nós fomos com um moooonte de amigos, mas cada um se sentou em um lugar do restaurante. Eu estava tão nervosa que não parava de falar por um segundo. Então ele olhou no fundo dos meus olhos e perguntou: “Eu queria saber se você gostaria de namorar comigo?”",
          "Eu me lembro de que minha primeira reação foi: “Você não acha que precisamos nos conhecer melhor primeiro?” E ele respondeu: “Não seria o namoro exatamente para isso?”",
          "Eu me lembro de ter pensado um pouco... Afinal, o que poderia acontecer?",
          "Tenho certeza de que foi uma das melhores decisões que já tomei na vida. Todo o carinho, a atenção, o respeito e o amor que recebi foram muito maiores do que eu jamais imaginei receber. Todas as músicas da Taylor que eu nunca imaginei ouvir pensando em alguém passaram a ser para ele — para o meu melhor amigo e para o meu amor.",
        ],
      },
      {
        heading: "Para o homem que mudou a profecia",
        paragraphs: [
          "Passei tanto tempo acreditando que algumas histórias eram feitas apenas para os outros, até que você apareceu e fez tudo mudar. Com você, descobri que alguns encontros realmente acontecem uma única vez na vida e não deixam dúvidas de que foram escritos pelo próprio Jeová. O que antes parecia um conto impossível se transformou na nossa própria história de amor, construída com coragem, escolhas e parceria. Você trouxe luz para os meus dias e me ensinou que o amor de verdade não vive na incerteza, mas na tranquilidade de saber que encontrou o seu lar. Mesmo quando o peso de ser sempre forte parecia maior do que eu podia suportar, você me lembrou de que eu também podia descansar, sonhar e ser cuidada.",
        ],
      },
    ],
  },
];
