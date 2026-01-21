import look1 from '../assets/images/shop-1.webp'
import look2 from '../assets/images/shop-2.webp'
import look3 from '../assets/images/shop-3.webp'
import look4 from '../assets/images/shop-4.webp'

export const CATEGORIES = ["TODOS", "CAMISETAS", "MOLETONS", "BONÉS", "CONJUNTOS"]

export const PRODUCTS = [
  { 
    id: 1, 
    name: "T-Shirt Oversized 'Arabic Logo'", 
    category: "CAMISETAS", 
    price: 149.90, 
    img: look1, 
    sizes: ['P', 'M', 'G', 'GG'] ,
    description: "A T-Shirt Star foi criada para quem vive a noite. Com modelagem oversized exclusiva, ela oferece caimento estruturado que não cola no corpo. A estampa traseira carrega o DNA da marca em silk-screen de alta densidade.",
    details: ["Malha Heavyweight 260g (Alta gramatura)", "100% Algodão Sustentável", "Gola canelada de 3cm (Não deforma)", "Pré-encolhida (Não encolhe na lavagem)", "Feito no Brasil"],
    gallery: [look1, look2, look1],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [
        { size: "P", values: ["56 cm", "74 cm", "22 cm"] },
        { size: "M", values: ["58 cm", "76 cm", "23 cm"] },
        { size: "G", values: ["60 cm", "78 cm", "24 cm"] },
        { size: "GG", values: ["64 cm", "82 cm", "25 cm"] },]
    }
  },
  { 
    id: 2, 
    name: "Hoodie Boxy 'Arabic Logo'", 
    category: "MOLETONS", 
    price: 279.90, 
    img: look2, 
    sizes: ['P', 'M', 'G', 'GG'],
    description: "O Hoodie definitivo. Modelagem quadrada (boxy) que fica na altura da cintura, ideal para compor camadas. Capuz duplo estruturado.",
    details: ["Moletom 3 cabos peluciado", "Punhos alongados", "Bolso canguru embutido"],
    gallery: [look2, look3, look2],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [
        { size: "P", values: ["56 cm", "74 cm", "22 cm"] },
        { size: "M", values: ["58 cm", "76 cm", "23 cm"] },
        { size: "G", values: ["60 cm", "78 cm", "24 cm"] },
        { size: "GG", values: ["64 cm", "82 cm", "25 cm"] },]
    }
  },
  { 
    id: 3, 
    name: "Hoddie Regular 'Big Arabic Logo'", 
    category: "MOLETONS", 
    price: 299.90, 
    img: look3, 
    sizes: ['P', 'M', 'G', 'GG'],
    description: "O Hoodie definitivo. Modelagem quadrada (boxy) que fica na altura da cintura, ideal para compor camadas. Capuz duplo estruturado.",
    details: ["Moletom 3 cabos peluciado", "Punhos alongados", "Bolso canguru embutido"],
    gallery: [look2, look3],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [
        { size: "P", values: ["56 cm", "74 cm", "22 cm"] },
        { size: "M", values: ["58 cm", "76 cm", "23 cm"] },
        { size: "G", values: ["60 cm", "78 cm", "24 cm"] },
        { size: "GG", values: ["64 cm", "82 cm", "25 cm"] },]
    }
  },
  { 
    id: 4, 
    name: "Trucker Cap 'Arabic Logo'", 
    category: "BONÉS", 
    price: 129.90, 
    img: look4, 
    sizes: ['UN'],
    description: "O Hoodie definitivo. Modelagem quadrada (boxy) que fica na altura da cintura, ideal para compor camadas. Capuz duplo estruturado.",
    details: ["Moletom 3 cabos peluciado", "Punhos alongados", "Bolso canguru embutido"],
    gallery: [look2, look3] 
  },
  { 
    id: 5, 
    name: "T-Shirt Regular 'MAMR'", 
    category: "CAMISETAS", 
    price: 149.90, 
    img: look1, 
    sizes: ['P', 'M', 'G', 'GG'],
    description: "O Hoodie definitivo. Modelagem quadrada (boxy) que fica na altura da cintura, ideal para compor camadas. Capuz duplo estruturado.",
    details: ["Moletom 3 cabos peluciado", "Punhos alongados", "Bolso canguru embutido"],
    gallery: [look2, look3],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [ 
        { size: "P", values: ["56 cm", "74 cm", "22 cm"] },
        { size: "M", values: ["58 cm", "76 cm", "23 cm"] },
        { size: "G", values: ["60 cm", "78 cm", "24 cm"] },
        { size: "GG", values: ["64 cm", "82 cm", "25 cm"] },]
    }
  },
  { 
    id: 6, 
    name: "Beanie 'SS Logo'", 
    category: "BONÉS", 
    price: 99.90, 
    img: look4, 
    sizes: ['UN'],
    description: "O Hoodie definitivo. Modelagem quadrada (boxy) que fica na altura da cintura, ideal para compor camadas. Capuz duplo estruturado.",
    details: ["Moletom 3 cabos peluciado", "Punhos alongados", "Bolso canguru embutido"],
    gallery: [look2, look3] 
  },
]