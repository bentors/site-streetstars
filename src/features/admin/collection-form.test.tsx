import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
const saveCollectionAction = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./catalog-actions', () => ({ saveCollectionAction }))
const signUploadAction = vi.hoisted(() => vi.fn())
vi.mock('./upload-actions', () => ({ signUploadAction }))

import { collectionToForm } from '@/lib/admin-collection'
import { CollectionForm } from './collection-form'

const cover = 'https://res.cloudinary.com/x/image/upload/c.jpg'

beforeEach(() => {
  vi.clearAllMocks()
  saveCollectionAction.mockResolvedValue({ ok: true, data: { id: 'c9' } })
})

describe('CollectionForm', () => {
  it('cria com capa e data de lançamento', async () => {
    render(
      <CollectionForm
        collectionId={null}
        initial={{ ...collectionToForm(null), coverImage: cover }}
      />,
    )
    await userEvent.type(screen.getByLabelText('Título'), 'Verão')
    await userEvent.type(screen.getByLabelText('Lançamento'), '2026-11-01')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar coleção' }))
    expect(saveCollectionAction).toHaveBeenCalledWith(
      null,
      expect.objectContaining({ title: 'Verão', coverImage: cover, launchedAt: '2026-11-01' }),
    )
    expect(router.push).toHaveBeenCalledWith('/admin/colecoes/c9')
  })

  it('sem capa não envia', async () => {
    render(<CollectionForm collectionId={null} initial={collectionToForm(null)} />)
    await userEvent.type(screen.getByLabelText('Título'), 'Verão')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar coleção' }))
    expect(await screen.findByText('Adicione a capa')).toBeInTheDocument()
    expect(saveCollectionAction).not.toHaveBeenCalled()
  })

  it('salvar continua bloqueado enquanto qualquer campo de foto ainda sobe', async () => {
    const signed = {
      ok: true,
      data: { cloudName: 'demo', apiKey: 'k', folder: 'streetstars', timestamp: 1, signature: 's' },
    }
    signUploadAction
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce(signed)
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/c.jpg', public_id: 'c' }),
          ),
      ),
    )
    render(<CollectionForm collectionId={null} initial={collectionToForm(null)} />)
    const [cover, , gallery] = screen.getAllByLabelText('Adicionar fotos')
    await userEvent.upload(gallery!, new File(['x'], 'g.jpg', { type: 'image/jpeg' }))
    await userEvent.upload(cover!, new File(['x'], 'c.jpg', { type: 'image/jpeg' }))
    await waitFor(() => expect(screen.queryAllByLabelText('Adicionar fotos')).toHaveLength(2))
    expect(screen.getByRole('button', { name: 'Salvar coleção' })).toBeDisabled()
  })
})
