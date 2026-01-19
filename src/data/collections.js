import collection1 from '../assets/images/collection-1.webp'
import collection1Hover from '../assets/images/collection-1-hover.webp'
import collection2 from '../assets/images/collection-2.webp'
import collection2Hover from '../assets/images/collection-2-hover.webp'
import collection3 from '../assets/images/collection-3.webp'
import collection3Hover from '../assets/images/collection-3-hover.webp'
import { i } from 'framer-motion/client'

export const collections = [
    {
    id: 1,
    title: 'The stars is every unique',
    description:
      'Peças atemporais, minimalistas e versáteis, onde as estrelas movem as ruas.',
    image: collection2,
    imageHover: collection2Hover,
  },  
  {
    id: 2,
    title: 'Mais amor, menos recalque',
    description:
      'Inspirada no funk e na cultura de periferia, para quem leva essa essência no peito.',
    image: collection1,
    imageHover: collection1Hover,
  },
  {
    id: 3,
    title: 'New drop in construction',
    description:
      'Lançamentos exclusivos em quantidades limitadas, feitos para quem busca diferenciação.',
    image: collection3,
    imageHover: collection3Hover,
  },
]
