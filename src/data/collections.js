import { images } from './images'

export const collections = [
  {
    id: 0,
    title: 'The stars is every unique',
    shortDescription: 'Peças atemporais, minimalistas e versáteis, onde as estrelas movem as ruas.',
    fullDescription: "Midnight Chaos é um estudo sobre a desordem organizada das metrópoles. Quando o sol cai, a cidade muda de cor, de som e de ritmo. Esta coleção captura a essência de quem encontra paz no barulho da madrugada.",
    credits: {
      photo: "Rafael Souza",
      direction: "Beatriz M.",
      styling: "Street Team",
    },
    // ID 0 = Coleção 1
    image: images.c1.main,
    imageHover: images.c1.hover,
    gallery: images.c1.gallery
  },
  {
    id: 1,
    title: 'Mais amor, menos recalque',
    shortDescription: 'Inspirada no funk e na cultura de periferia, para quem leva essa essência no peito.',
    fullDescription: "A coleção 'Mais Amor, Menos Recalque' é uma celebração da autenticidade e da resistência das comunidades periféricas. Cada peça é um manifesto de amor-próprio e solidariedade.",
    credits: {
      photo: "Rafael Souza",
      direction: "Beatriz M.",
      styling: "Street Team",
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