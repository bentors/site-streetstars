import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Checkbox } from './checkbox'
import { Field } from './field'
import { Input } from './input'

describe('Field', () => {
  it('associa o label ao controle', () => {
    render(<Field label="E-mail">{(control) => <Input {...control} />}</Field>)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
  })

  it('marca erro como inválido e descrito pela mensagem', () => {
    render(
      <Field label="CPF" error="CPF inválido." hint="Somente números">
        {(control) => <Input {...control} />}
      </Field>,
    )
    const input = screen.getByLabelText('CPF')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Somente números CPF inválido.')
    expect(screen.getByRole('alert')).toHaveTextContent('CPF inválido.')
  })
})

describe('Checkbox', () => {
  it('alterna ao clicar no texto', async () => {
    render(<Checkbox label="Quero novidades" />)
    const checkbox = screen.getByRole('checkbox', { name: 'Quero novidades' })
    await userEvent.click(screen.getByText('Quero novidades'))
    expect(checkbox).toBeChecked()
  })
})
