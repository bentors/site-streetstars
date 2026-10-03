import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('é type="button" por padrão para não submeter formulários sem querer', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button')
  })

  it('fica desabilitado e mostra spinner ao carregar', () => {
    render(<Button loading>Salvar</Button>)
    const button = screen.getByRole('button', { name: /salvar/i })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument()
  })
})
