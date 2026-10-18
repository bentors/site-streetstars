import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
const saveCollectionAction = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('./catalog-actions', () => ({ saveCollectionAction }))
vi.mock('./upload-actions', () => ({ signUploadAction: vi.fn() }))

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
})
