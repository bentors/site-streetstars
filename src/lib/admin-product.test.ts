import { describe, expect, it } from 'vitest'
import {
  formatSizeGuide,
  parseSizeGuide,
  productFormSchema,
  productToForm,
  type ProductFormValues,
} from './admin-product'

const image = { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a', alt: '' }

const values = (overrides: Partial<ProductFormValues> = {}): ProductFormValues => ({
  ...productToForm(null),
  name: 'Camiseta Estrela',
  price: '149,9',
  weightGrams: '250',
  productionDays: '10',
  sizes: 'P, M, G, M',
  images: [image],
  ...overrides,
})

describe('parseSizeGuide / formatSizeGuide', () => {
  const text = 'Tam; Largura; Comprimento\nP; 50; 70\nM; 53; 72'

  it('lê colunas e linhas', () => {
    expect(parseSizeGuide(text)).toEqual({
      columns: ['Tam', 'Largura', 'Comprimento'],
      rows: [
        { size: 'P', values: ['50', '70'] },
        { size: 'M', values: ['53', '72'] },
      ],
    })
  })

  it('vazio é null; linha torta é inválida', () => {
    expect(parseSizeGuide('  \n ')).toBeNull()
    expect(parseSizeGuide('Tam; Largura\nP; 50; 70')).toBe('invalid')
    expect(parseSizeGuide('Tam; Largura')).toBe('invalid')
  })

  it('ida e volta', () => {
    expect(formatSizeGuide(parseSizeGuide(text) as never)).toBe(text)
    expect(formatSizeGuide(null)).toBe('')
  })
})

describe('productFormSchema', () => {
  it('converte o formulário para o documento', () => {
    expect(productFormSchema.parse(values())).toMatchObject({
      name: 'Camiseta Estrela',
      slug: 'camiseta-estrela',
      priceCents: 14990,
      weightGrams: 250,
      productionDays: 10,
      sizes: ['P', 'M', 'G'],
      highlights: [],
      sizeGuide: null,
      status: 'draft',
    })
  })

  it('apara o slug digitado e recusa slug malformado', () => {
    expect(productFormSchema.parse(values({ slug: ' moletom-x ' })).slug).toBe('moletom-x')
    const bad = productFormSchema.safeParse(values({ slug: 'Moletom X' }))
    expect(bad.error?.issues[0]?.path).toEqual(['slug'])
  })

  it.each([
    [{ price: '0' }, 'price', 'Preço inválido'],
    [{ price: 'abc' }, 'price', 'Preço inválido'],
    [{ weightGrams: '0' }, 'weightGrams', 'Peso inválido'],
    [{ sizes: ' , ' }, 'sizes', 'Informe ao menos um tamanho'],
    [{ images: [] }, 'images', 'Adicione ao menos uma foto'],
    [{ sizeGuide: 'Tam; A\nP' }, 'sizeGuide', 'Guia de medidas inválido'],
    [{ category: 'X' }, 'category', 'Categoria inválida'],
  ])('%j → erro em %s', (patch, path, message) => {
    const result = productFormSchema.safeParse(values(patch as Partial<ProductFormValues>))
    const issue = result.error?.issues.find((i) => i.path[0] === path)
    expect(issue?.message).toBe(message)
  })

  it('destaques um por linha, sem linhas vazias', () => {
    expect(
      productFormSchema.parse(values({ highlights: 'Algodão\n\n Estampa silk ' })).highlights,
    ).toEqual(['Algodão', 'Estampa silk'])
  })
})

describe('productToForm', () => {
  it('produto existente volta para o formulário', () => {
    const doc = productFormSchema.parse(values({ highlights: 'A\nB', sizeGuide: 'Tam; L\nP; 50' }))
    const form = productToForm({
      ...doc,
      featured: false,
      featuredOrder: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(form).toMatchObject({
      price: '149,90',
      weightGrams: '250',
      sizes: 'P, M, G',
      highlights: 'A\nB',
      sizeGuide: 'Tam; L\nP; 50',
    })
  })
})
