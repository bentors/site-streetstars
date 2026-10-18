import { Field } from './field'
import { Input } from './input'

/** Input com rótulo e erro; `onValue` recebe o texto já extraído do evento. */
export function TextField({
  label,
  error,
  hint,
  onValue,
  ...props
}: Omit<React.ComponentProps<'input'>, 'onChange'> & {
  label: string
  error?: string
  hint?: string
  onValue: (value: string) => void
}) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(control) => (
        <Input {...props} {...control} onChange={(event) => onValue(event.target.value)} />
      )}
    </Field>
  )
}
