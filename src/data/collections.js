const CLOUD_NAME = "dmsvju9ca"; 
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

export const collections = [
  {
    id: 0,
    title: 'EVERY STAR IS UNIQUE',
    shortDescription: 'Peças atemporais e minimalistas, onde as estrelas movem as ruas.',
    fullDescription: [
      "Fevereiro de 2024. O drop que colocou a Street Stars no mapa. Nasceu de uma logo criada na madrugada, num brainstorm onde a única regra era destoar. A vontade de fazer diferente virou bordado, virou corte, virou identidade.",
      "Modelagem boxy, bordados de qualidade premium, cada peça pensada nos mínimos detalhes. Camisetas, moletons, bonés trucker e toucas que carregam o símbolo que começou tudo.",
      "Para quem produz na madrugada. Para quem encontra inspiração no caos das ruas. Para quem entende que cada estrela brilha do seu próprio jeito."
    ],
    credits: {
      photo: "@jotc.films",
      direction: "@eyyale, @amarijd_, @rybkaue",
      styling: "Street Stars",
    },
    image: `${BASE_URL}/esiu-main.jpg`,
    imageHover: `${BASE_URL}/esiu-hover.jpg`,
    gallery: [
      `${BASE_URL}/esiu-hover.jpg`,
      `${BASE_URL}/esiu-1.jpg`,
      `${BASE_URL}/esiu-2.jpg`,
      `${BASE_URL}/esiu-3.jpg`,
      `${BASE_URL}/esiu-4.jpg`
    ]
  },
  {
    id: 1,
    title: 'MAIS AMOR, MENOS RECALQUE',
    shortDescription: 'Inspirada na cultura de periferia, para quem leva essa essência no peito.',
    fullDescription: [ 
      "Inspirada na cultura de periferia, para quem vive essa essência de verdade. Nossa segunda coleção nasce do funk, da quebrada, da autenticidade que a Street Stars sempre carregou.",
      "'Mais amor, menos recalque' do baile pra rua, da rua pro corpo. Filosofia que virou identidade.",
      "Camisetas com estampas nas costas, moletom e boné trucker. O logo árabe que nos define desde o começo, agora lado a lado com frases que ecoam nas ruas. Cada peça carrega a energia de quem sabe de onde veio.",
      "Para quem entende que o funk é cultura, que a periferia é potência, que autenticidade não se negocia."
    ],
    credits: {
      photo: "@stk.zip, @berna_thephotographer, @trajano.jpg",
      direction: "@kvanh4z, @bentorxngel",
      styling: "Street Stars",
    },
    image: `${BASE_URL}/mamr-main.jpg`,
    imageHover: `${BASE_URL}/mamr-hover.jpg`,
    gallery: [
      `${BASE_URL}/mamr-hover.jpg`,
      `${BASE_URL}/mamr-1.jpg`,
      `${BASE_URL}/mamr-2.jpg`,
      `${BASE_URL}/mamr-3.jpg`,
      `${BASE_URL}/mamr-4.jpg`
    ]
  },
  {
    id: 2,
    title: 'New drop in construction',
    shortDescription: 'Lançamentos exclusivos em quantidades limitadas, feitos para quem busca diferenciação.',
    fullDescription: "A coleção 'New Drop in Construction' apresenta peças exclusivas e limitadas, criadas para quem busca originalidade e estilo único.",
    credits: {
      photo: "Rafael Souza",
      direction: "Beatriz M.",
      styling: "Street Team",
    },
    image: `${BASE_URL}/construction-main.jpg`, 
    imageHover: `${BASE_URL}/construction-hover.jpg`,
    gallery: [
      `${BASE_URL}/construction-1.jpg`,
      `${BASE_URL}/construction-2.jpg`
    ]
  },
]