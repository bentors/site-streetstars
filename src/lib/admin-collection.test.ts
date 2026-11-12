import { describe, expect, it } from 'vitest'
import { collectionFormSchema, collectionToForm } from './admin-collection'

const base = {
  ...collectionToForm(null),
  title: 'Verão Estrela',
  body: 'Primeiro parágrafo.\nContinua.\n\n\nSegundo.',
  coverImage: 'https://res.cloudinary.com/x/image/upload/c.jpg',
  order: '3',
  launchedAt: '2026-11-01',
}

describe('collectionFormSchema', () => {
  it('converte o formulário', () => {
    expect(collectionFormSchema.parse(base)).toEqual({
      slug: 'verao-estrela',
      title: 'Verão Estrela',
      shortDescription: '',
      body: ['Primeiro parágrafo.\nContinua.', 'Segundo.'],
      credits: { photo: '', direction: '', styling: '' },
      coverImage: base.coverImage,
      hoverImage: null,
      gallery: [],
      status: 'draft',
      order: 3,
      launchedAt: new Date('2026-11-01T03:00:00.000Z'),
    })
  })

  it('exige capa e ordem numérica', () => {
    const result = collectionFormSchema.safeParse({ ...base, coverImage: '', order: 'x' })
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(['coverImage', 'order'])
  })

  it('ida e volta', () => {
    const doc = collectionFormSchema.parse(base)
    expect(collectionFormSchema.parse(collectionToForm(doc))).toEqual(doc)
  })
})
