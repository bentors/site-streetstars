import { productAssets } from './images'

export const CATEGORIES = ["TODOS", "CAMISETAS", "MOLETONS", "BONÉS", "CONJUNTOS"]

export const PRODUCTS = [
  { 
    id: 1, 
    name: "T-Shirt Boxy 'Arabic Logo'", 
    category: "CAMISETAS", 
    price: 149.90, 
    img: productAssets.p1.main, 
    gallery: productAssets.p1.gallery,
    sizes: ['P', 'M', 'G', 'GG'] ,
    description: "Camiseta boxy com o logo árabe que define a Street Stars. Modelagem ampla com ombros caídos e costura deslocada, o fit clássico do streetwear. Bordado em alta definição no centralizado no peito.",
    details: ["Modelagem oversized", "100% Algodão fio 20.1 penteado", "Gramatura: 220g/m²", "Gola ribana canelada 3cm", "Bordado premium"],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [
        { size: "P", values: ["59 cm", "65 cm", "19,5 cm"] },
        { size: "M", values: ["62 cm", "68 cm", "21,5 cm"] },
        { size: "G", values: ["65 cm", "70,5 cm", "22,5 cm"] },
        { size: "GG", values: ["68 cm", "73 cm", "25 cm"] },]
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
    description: "O moletom definitivo. Modelagem boxy quadrada, ideal pra compor camadas. Moletom 3 cabos peluciado com acabamento interno macio e bolso canguru embutido.",
    details: ["Modelagem boxy", "Moletom 3 cabos peluciado", "Gramatura: 400g/m²", "Bolso canguru embutido", "Bordado premium"],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [
        { size: "P", values: ["65 cm", "66 cm", "56,5 cm"] },
        { size: "M", values: ["68 cm", "66 cm", "58 cm"] },
        { size: "G", values: ["70 cm", "67 cm", "59,5 cm"] },
        { size: "GG", values: ["71,5 cm", "72 cm", "61 cm"] },]
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
    description: "Modelagem regular fit, perfeita pro dia a dia. Moletom 3 cabos com estampa bordada premium nas costas, o logo árabe em destaque máximo. Conforto e presença.",
    details: ["Modelagem regular", "Moletom 3 cabos", "Gramatura: 400g/m²", "Bordado Premium frontal e traseiro"],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [
        { size: "P", values: ["64 cm", "72 cm", "60,5 cm"] },
        { size: "M", values: ["66 cm", "74 cm", "62 cm"] },
        { size: "G", values: ["68 cm", "76 cm", "63,5 cm"] },
        { size: "GG", values: ["70 cm", "78 cm", "65 cm"] },]
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
    description: "Boné estilo trucker com tela respirável e ajuste snapback. Logo bordado em alta definição, destaque garantido.",
    details: ["Aba curva", "Fecho Snapback ajustável", "Frente em tecido acolchoado", "Traseira em mesh", "Bordado em alta definição"],
  },
  { 
    id: 5, 
    name: "T-Shirt Regular 'MAMR'", 
    category: "CAMISETAS", 
    price: 149.90, 
    img: productAssets.p5.main, 
    gallery: productAssets.p5.gallery,
    sizes: ['P', 'M', 'G', 'GG'],
    description: "Camiseta com corte regular e estampa 'Mais Amor Menos Recalque'. Essencial e direta. Da coleção que celebra o funk e a cultura de periferia.",
    details: ["Modelagem regular", "Algodão fio 20.1 penteado", "Toque macio", "Estampa digital", "Pespontos reforçados"],
    measurements: {
      columns: ["Tamanho", "Largura", "Comprimento", "Manga"],
      rows: [ 
        { size: "P", values: ["53 cm", "72 cm", "23 cm"] },
        { size: "M", values: ["55 cm", "74 cm", "24 cm"] },
        { size: "G", values: ["57 cm", "76 cm", "25 cm"] },
        { size: "GG", values: ["59 cm", "78 cm", "26 cm"] },]
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
    description: "Touca canelada com patch bordado. Estilo worker pra dias frios. Lã sintética acrílica antialérgica de alta qualidade.",
    details: ["Lã acrílica antialérgica", "Tamanho único flexível", "Etiqueta bordada", "(Canelada sem dobras)"],
  },
]