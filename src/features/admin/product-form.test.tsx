import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
const saveProductAction = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./catalog-actions', () => ({ saveProductAction }))
vi.mock('./upload-actions', () => ({ signUploadAction: vi.fn() }))

import { productToForm } from '@/lib/admin-product'
import { ProductForm } from './product-form'

const image = { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a', alt: '' }
const collections = [{ id: 'c1', title: 'Verão' }]

beforeEach(() => {
  vi.clearAllMocks()
  saveProductAction.mockResolvedValue({ ok: true, data: { id: 'p9' } })
})

async function fillRequired() {
  await userEvent.type(screen.getByLabelText('Nome'), 'Camiseta Estrela')
  await userEvent.type(screen.getByLabelText('Preço (R$)'), '149,90')
  await userEvent.type(screen.getByLabelText('Peso (g)'), '250')
  await userEvent.type(screen.getByLabelText('Tamanhos (separados por vírgula)'), 'P, M')
}

describe('ProductForm', () => {
  it('cria e vai para a página do produto', async () => {
    render(
      <ProductForm
        productId={null}
        initial={{ ...productToForm(null), images: [image] }}
        collections={collections}
      />,
    )
    await fillRequired()
    await userEvent.click(screen.getByLabelText('Verão'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))

    expect(saveProductAction).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        name: 'Camiseta Estrela',
        price: '149,90',
        sizes: 'P, M',
        collectionIds: ['c1'],
        images: [image],
      }),
    )
    expect(router.push).toHaveBeenCalledWith('/admin/produtos/p9')
  })

  it('erro de validação aparece no campo e não envia', async () => {
    render(<ProductForm productId={null} initial={productToForm(null)} collections={[]} />)
    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))
    expect(await screen.findByText('Adicione ao menos uma foto')).toBeInTheDocument()
    expect(saveProductAction).not.toHaveBeenCalled()
  })

  it('erro do servidor no slug marca o campo', async () => {
    saveProductAction.mockResolvedValue({
      ok: false,
      code: 'slug_taken',
      message: 'Já existe um produto com esse endereço (slug).',
    })
    render(
      <ProductForm
        productId="p1"
        initial={{ ...productToForm(null), images: [image] }}
        collections={[]}
      />,
    )
    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))
    expect(await screen.findByText(/Já existe um produto/)).toBeInTheDocument()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('cores: adiciona, escolhe a foto da cor e remove', async () => {
    render(
      <ProductForm
        productId={null}
        initial={{ ...productToForm(null), images: [image] }}
        collections={[]}
      />,
    )
    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar cor' }))
    await userEvent.type(screen.getByLabelText('Nome da cor 1'), 'Preto')
    await userEvent.selectOptions(screen.getByLabelText('Foto da cor 1'), image.url)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar produto' }))
    expect(saveProductAction.mock.calls[0]?.[1].colors).toEqual([
      { name: 'Preto', hex: '#000000', image: image.url },
    ])
  })
})
