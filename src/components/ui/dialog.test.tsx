import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Drawer, Modal } from './dialog'

describe('Modal', () => {
  it('não mostra nada fechado', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Confirmar">
        conteúdo
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abre com título acessível', () => {
    render(
      <Modal open onClose={() => {}} title="Confirmar exclusão">
        conteúdo
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Confirmar exclusão' })).toBeInTheDocument()
  })

  it('chama onClose pelo botão fechar', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Confirmar">
        conteúdo
      </Modal>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('chama onClose quando o navegador fecha o dialog (Escape)', () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Confirmar">
        conteúdo
      </Modal>,
    )
    fireEvent(screen.getByRole('dialog'), new Event('close'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('Drawer', () => {
  it('abre com título acessível', () => {
    render(
      <Drawer open onClose={() => {}} title="Sua sacola">
        itens
      </Drawer>,
    )
    expect(screen.getByRole('dialog', { name: 'Sua sacola' })).toBeInTheDocument()
  })
})
