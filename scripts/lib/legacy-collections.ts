import type { CollectionDoc } from '../../src/lib/catalog-schemas'

const BASE = 'https://res.cloudinary.com/dmsvju9ca/image/upload'

// Conteúdo de legacy/src/data/collections.js, no formato novo.
export const LEGACY_COLLECTIONS: CollectionDoc[] = [
  {
    slug: 'every-star-is-unique',
    title: 'EVERY STAR IS UNIQUE',
    shortDescription: 'Peças atemporais e minimalistas, onde as estrelas movem as ruas.',
    body: [
      'Fevereiro de 2024. O drop que colocou a Street Stars no mapa. Nasceu de uma logo criada na madrugada, num brainstorm onde a única regra era destoar. A vontade de fazer diferente virou bordado, virou corte, virou identidade.',
      'Modelagem boxy, bordados de qualidade premium, cada peça pensada nos mínimos detalhes. Camisetas, moletons, bonés trucker e toucas que carregam o símbolo que começou tudo.',
      'Para quem produz na madrugada. Para quem encontra inspiração no caos das ruas. Para quem entende que cada estrela brilha do seu próprio jeito.',
    ],
    credits: {
      photo: '@jotc.films',
      direction: '@eyyale, @amarijd_, @rybkaue',
      styling: 'Street Stars',
    },
    coverImage: `${BASE}/esiu-main.jpg`,
    hoverImage: `${BASE}/esiu-hover.jpg`,
    gallery: [
      `${BASE}/esiu-hover.jpg`,
      `${BASE}/esiu-1.jpg`,
      `${BASE}/esiu-2.jpg`,
      `${BASE}/esiu-3.jpg`,
      `${BASE}/esiu-4.jpg`,
    ],
    status: 'published',
    order: 0,
    launchedAt: new Date('2024-02-01T00:00:00.000Z'),
  },
  {
    slug: 'mais-amor-menos-recalque',
    title: 'MAIS AMOR, MENOS RECALQUE',
    shortDescription: 'Inspirada na cultura de periferia, para quem leva essa essência no peito.',
    body: [
      'Inspirada na cultura de periferia, para quem vive essa essência de verdade. Nossa segunda coleção nasce do funk, da quebrada, da autenticidade que a Street Stars sempre carregou.',
      "'Mais amor, menos recalque' do baile pra rua, da rua pro corpo. Filosofia que virou identidade.",
      'Camisetas com estampas nas costas, moletom e boné trucker. O logo árabe que nos define desde o começo, agora lado a lado com frases que ecoam nas ruas. Cada peça carrega a energia de quem sabe de onde veio.',
      'Para quem entende que o funk é cultura, que a periferia é potência, que autenticidade não se negocia.',
    ],
    credits: {
      photo: '@stk.zip, @berna_thephotographer, @trajano.jpg',
      direction: '@kvanh4z, @bentorxngel',
      styling: 'Street Stars',
    },
    coverImage: `${BASE}/mamr-main.jpg`,
    hoverImage: `${BASE}/mamr-hover.jpg`,
    gallery: [
      `${BASE}/mamr-hover.jpg`,
      `${BASE}/mamr-1.jpg`,
      `${BASE}/mamr-2.jpg`,
      `${BASE}/mamr-3.jpg`,
      `${BASE}/mamr-4.jpg`,
    ],
    status: 'published',
    order: 1,
    launchedAt: null,
  },
  {
    slug: 'new-drop',
    title: 'New drop in construction',
    shortDescription:
      'Lançamentos exclusivos em quantidades limitadas, feitos para quem busca diferenciação.',
    body: [
      "A coleção 'New Drop in Construction' apresenta peças exclusivas e limitadas, criadas para quem busca originalidade e estilo único.",
    ],
    credits: { photo: '', direction: '', styling: 'Street Stars' },
    coverImage: `${BASE}/mamr-main.jpg`,
    hoverImage: null,
    gallery: [],
    status: 'draft',
    order: 2,
    launchedAt: null,
  },
]
