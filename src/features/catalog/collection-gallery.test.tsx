import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CollectionGallery } from './collection-gallery'

const images = [
  'https://res.cloudinary.com/x/image/upload/a.jpg',
  'https://res.cloudinary.com/x/image/upload/b.jpg',
]

describe('CollectionGallery', () => {
  it('amplia a foto clicada', async () => {
    render(<CollectionGallery title="Drop 1" images={images} />)
    await userEvent.click(screen.getByRole('button', { name: 'Ampliar foto 2 de Drop 1' }))
    expect(screen.getByRole('dialog', { name: 'Drop 1 — foto 2' })).toBeInTheDocument()
  })
})
