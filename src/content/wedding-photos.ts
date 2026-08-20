export type WeddingPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  playful?: boolean;
};

export const WEDDING_GALLERY: readonly WeddingPhoto[] = [
  {
    src: "/images/ensaio/mg-0015.jpg",
    alt: "Carol e Denys caminhando de mãos dadas pelo campo",
    width: 1365,
    height: 2048,
    orientation: "portrait",
  },
  {
    src: "/images/ensaio/mg-0019.jpg",
    alt: "Carol e Denys seguindo juntos por uma trilha no campo",
    width: 2048,
    height: 1365,
    orientation: "landscape",
  },
  {
    src: "/images/ensaio/mg-0060.jpg",
    alt: "Carol puxando Denys pela mão e sorrindo durante o ensaio",
    width: 2048,
    height: 1365,
    orientation: "landscape",
  },
  {
    src: "/images/ensaio/mg-0026.jpg",
    alt: "Carol olhando para a câmera com Denys ao seu lado no campo",
    width: 1365,
    height: 2048,
    orientation: "portrait",
  },
  {
    src: "/images/ensaio/mg-0105.jpg",
    alt: "Carol e Denys rindo com as testas encostadas",
    width: 1365,
    height: 2048,
    orientation: "portrait",
  },
  {
    src: "/images/ensaio/mg-0084.jpg",
    alt: "Carol e Denys dançando e sorrindo no campo",
    width: 2048,
    height: 1365,
    orientation: "landscape",
  },
  {
    src: "/images/ensaio/mg-0074.jpg",
    alt: "Carol e Denys dançando em um retrato espontâneo em preto e branco",
    width: 1365,
    height: 2048,
    orientation: "portrait",
  },
  {
    src: "/images/ensaio/mg-0315.jpg",
    alt: "Carol e Denys girando juntos sob a luz do fim da tarde",
    width: 1365,
    height: 2048,
    orientation: "portrait",
  },
  {
    src: "/images/ensaio/mg-0323.jpg",
    alt: "Denys inclinando Carol durante a dança no campo",
    width: 1365,
    height: 2048,
    orientation: "portrait",
  },
  {
    src: "/images/ensaio/foto-engracada.jpg",
    alt: "Carol ajeitando o vestido enquanto Denys observa em um momento divertido",
    width: 1365,
    height: 2048,
    orientation: "portrait",
    playful: true,
  },
] as const;

export const WEDDING_INSPIRATION: readonly WeddingPhoto[] = [
  {
    src: "/images/inspiracao/mesa-ao-ar-livre.jpg",
    alt: "Inspiração de mesas compridas ao ar livre com flores em vinho e verde",
    width: 1066,
    height: 1600,
    orientation: "portrait",
  },
  {
    src: "/images/inspiracao/flores-vinho-e-verde.jpg",
    alt: "Inspiração floral em branco, vinho e verde profundo",
    width: 880,
    height: 1200,
    orientation: "portrait",
  },
  {
    src: "/images/inspiracao/mesa-junto-ao-lago.jpg",
    alt: "Inspiração de mesa com velas e flores brancas junto à água",
    width: 1000,
    height: 1500,
    orientation: "portrait",
  },
  {
    src: "/images/inspiracao/arranjo-e-velas.jpg",
    alt: "Inspiração de arranjo com folhagens, flores vinho e velas",
    width: 1080,
    height: 1439,
    orientation: "portrait",
  },
] as const;
