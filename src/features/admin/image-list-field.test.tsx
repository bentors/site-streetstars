import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const signUploadAction = vi.hoisted(() => vi.fn())
vi.mock('./upload-actions', () => ({ signUploadAction }))

import type { ProductImage } from '@/lib/catalog-schemas'
import { ImageListField } from './image-list-field'

const img = (n: number): ProductImage => ({
  url: `https://res.cloudinary.com/x/image/upload/${n}.jpg`,
  publicId: String(n),
  alt: '',
})

function Harness({ initial, max }: { initial: ProductImage[]; max?: number }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <ImageListField
        label="Fotos"
        value={value}
        onChange={(update) => setValue((current) => update(current))}
        max={max}
        withAlt
      />
      <output data-testid="ids">{value.map((i) => i.publicId).join(',')}</output>
    </>
  )
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  signUploadAction.mockResolvedValue({
    ok: true,
    data: { cloudName: 'demo', apiKey: 'k', folder: 'streetstars', timestamp: 1, signature: 's' },
  })
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        secure_url: 'https://res.cloudinary.com/demo/n.jpg',
        public_id: 'streetstars/n',
      }),
    ),
  )
})

describe('ImageListField', () => {
  it('reordena e remove', async () => {
    render(<Harness initial={[img(1), img(2)]} />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Mover para baixo' })[0]!)
    expect(screen.getByTestId('ids')).toHaveTextContent('2,1')
    await userEvent.click(screen.getAllByRole('button', { name: 'Remover' })[0]!)
    expect(screen.getByTestId('ids')).toHaveTextContent('1')
  })

  it('envia o arquivo assinado ao Cloudinary e acrescenta a foto', async () => {
    render(<Harness initial={[]} />)
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })
    await userEvent.upload(screen.getByLabelText('Adicionar fotos'), file)
    await waitFor(() => expect(screen.getByTestId('ids')).toHaveTextContent('streetstars/n'))
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.cloudinary.com/v1_1/demo/image/upload')
    const body = init.body as FormData
    expect(body.get('signature')).toBe('s')
    expect(body.get('folder')).toBe('streetstars')
    expect(body.get('api_key')).toBe('k')
  })

  it('mostra erro de upload sem perder as fotos', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 400 }))
    render(<Harness initial={[img(1)]} />)
    await userEvent.upload(
      screen.getByLabelText('Adicionar fotos'),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    )
    expect(await screen.findByText(/Não foi possível enviar a foto/)).toBeInTheDocument()
    expect(screen.getByTestId('ids')).toHaveTextContent('1')
  })

  it('remover uma foto durante o upload não é desfeito quando o upload termina', async () => {
    let finish: (value: Response) => void = () => {}
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => (finish = resolve)))
    render(<Harness initial={[img(1), img(2)]} />)
    await userEvent.upload(
      screen.getByLabelText('Adicionar fotos'),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
    )
    await userEvent.click(screen.getAllByRole('button', { name: 'Remover' })[0]!)
    expect(screen.getByTestId('ids')).toHaveTextContent('2')
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    finish(
      new Response(
        JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/n.jpg', public_id: 'n' }),
      ),
    )
    await waitFor(() => expect(screen.getByTestId('ids')).toHaveTextContent('2,n'))
  })

  it('com max atingido esconde o upload', () => {
    render(<Harness initial={[img(1)]} max={1} />)
    expect(screen.queryByLabelText('Adicionar fotos')).not.toBeInTheDocument()
  })
})
