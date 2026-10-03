import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from './toast'

function Trigger() {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast({ message: 'Salvo!', tone: 'success' })}>
      salvar
    </button>
  )
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mostra a mensagem e some após a duração', () => {
    render(
      <ToastProvider duration={1000}>
        <Trigger />
      </ToastProvider>,
    )
    act(() => screen.getByRole('button', { name: 'salvar' }).click())
    expect(screen.getByText('Salvo!')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.queryByText('Salvo!')).not.toBeInTheDocument()
  })

  it('exige o provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Trigger />)).toThrow('useToast deve ser usado dentro de ToastProvider')
    spy.mockRestore()
  })
})
