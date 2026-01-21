import { images } from './images'

export const collections = [
  {
    id: 0,
    title: 'The stars is every unique',
    shortDescription: 'Peças atemporais e minimalistas, onde as estrelas movem as ruas.',
    fullDescription: "'The star is every unique' foi o primeiro lançamento da Street Stars, lançado em fevereiro de 2024. O drop que trouxe a marca ao mundo e é marca registrada até hoje. Essa coleção traz a essência de quem encontra paz no barulho da madrugada, a luz das estrelas.",
    credits: {
      photo: "@jotc.films",
      direction: "@eyyale, @amarijd_, @rybkaue",
      styling: "Street Stars",
    },
    // ID 0 = Coleção 1
    image: images.c1.main,
    imageHover: images.c1.hover,
    gallery: images.c1.gallery
  },
  {
    id: 1,
    title: 'Mais amor, menos recalque',
    shortDescription: 'Inspirada na cultura de periferia, para quem leva essa essência no peito.',
    fullDescription: "'Mais amor, Menos recalque' é a coleção que reforça a resistência das favelas, a cultura do funk e a autenticidade da Street Stars. Lançada em 2025, com o nosso logo arabic e frases marcantes para a cultura das ruas, esse foi o segundo lançamento da Street Stars.",
    credits: {
      photo: "@stk.zip, @berna_thephotographer, @trajano.jpg",
      direction: "@kvanh4z, @bentorxngel",
      styling: "Street Stars",
    },
    // ID 1 = Coleção 2
    image: images.c2.main,
    imageHover: images.c2.hover,
    gallery: images.c2.gallery
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
    // ID 2 = Coleção 3
    image: images.c3.main,
    imageHover: images.c3.hover,
    gallery: images.c3.gallery
  },
]