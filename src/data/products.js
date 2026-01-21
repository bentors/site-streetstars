// src/data/products.js
import { productAssets } from './images'

export const CATEGORIES = ["TODOS", "CAMISETAS", "MOLETONS", "BONÉS", "CONJUNTOS"]

export const PRODUCTS = [
  { 
    id: 1, 
    name: "T-Shirt Oversized 'Arabic Logo'", 
    category: "CAMISETAS", 
    price: 149.90, 
    img: productAssets.p1.main, 
    gallery: productAssets.p1.gallery,
    sizes: ['P', 'M', 'G', 'GG'] ,
    description: "A T-Shirt Star foi criada para quem vive a noite. Com modelagem oversized exclusiva, ela oferece caimento estruturado.",
    details: ["Malha Heavyweight 260g", "100% Algodão", "Gola canelada 3cm", "Pré-encolhida", "Feito no Brasil"],
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
    img: productAssets.p2.main, 
    gallery: productAssets.p2.gallery,
    sizes: ['P', 'M', 'G', 'GG'],
    description: "O Hoodie definitivo. Modelagem quadrada (boxy) que fica na altura da cintura, ideal para compor camadas.",
    details: ["Moletom 3 cabos peluciado", "Punhos alongados", "Bolso canguru embutido"],
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
    name: "Hoodie Regular 'Big Arabic Logo'", 
    category: "MOLETONS", 
    price: 299.90, 
    img: productAssets.p3.main, 
    gallery: productAssets.p3.gallery,
    sizes: ['P', 'M', 'G', 'GG'],
    description: "Modelagem regular fit, perfeita para o dia a dia, com a estampa clássica em destaque.",
    details: ["Moletom 2 cabos", "Cordão ajustável", "Estampa Silk Premium"],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [
        { size: "P", values: ["54 cm", "72 cm", "64 cm"] },
        { size: "M", values: ["56 cm", "74 cm", "65 cm"] },
        { size: "G", values: ["58 cm", "76 cm", "66 cm"] },
        { size: "GG", values: ["60 cm", "78 cm", "67 cm"] },]
    }
  },
  { 
    id: 4, 
    name: "Trucker Cap 'Arabic Logo'", 
    category: "BONÉS", 
    price: 129.90, 
    img: productAssets.p4.main, 
    gallery: productAssets.p4.gallery,
    sizes: ['UN'],
    description: "Boné estilo Trucker com tela respirável e ajuste snapback. Logo bordado em alta definição.",
    details: ["Aba curva", "Fecho Snapback ajustável", "Bordado 3D"],
  },
  { 
    id: 5, 
    name: "T-Shirt Regular 'MAMR'", 
    category: "CAMISETAS", 
    price: 149.90, 
    img: productAssets.p5.main, 
    gallery: productAssets.p5.gallery,
    sizes: ['P', 'M', 'G', 'GG'],
    description: "Camiseta com corte regular e estampa 'Mais Amor Menos Recalque'. Essencial e direta.",
    details: ["Algodão fio 30.1 penteado", "Toque macio", "Estampa digital"],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [ 
        { size: "P", values: ["52 cm", "70 cm", "20 cm"] },
        { size: "M", values: ["54 cm", "72 cm", "21 cm"] },
        { size: "G", values: ["56 cm", "74 cm", "22 cm"] },
        { size: "GG", values: ["60 cm", "78 cm", "23 cm"] },]
    }
  },
  { 
    id: 6, 
    name: "Beanie 'SS Logo'", 
    category: "BONÉS", 
    price: 99.90, 
    img: productAssets.p6.main, 
    gallery: productAssets.p6.gallery,
    sizes: ['UN'],
    description: "Touca canelada com dobra (cuff) e patch bordado. Estilo worker para dias frios.",
    details: ["Lã acrílica antialérgica", "Tamanho único flexível", "Etiqueta bordada"],
  },
]