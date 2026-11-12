const TIME_ZONE = 'America/Sao_Paulo'
// ponytail: offset fixo; o Brasil não tem horário de verão desde 2019. Se voltar, usar Intl para o offset.
const OFFSET = '-03:00'

const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: TIME_ZONE })
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
})
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export const formatDate = (value: Date) => date.format(value)
export const formatDateTime = (value: Date) => dateTime.format(value)

export function toSaoPauloInput(value: Date | null, withTime: boolean): string {
  if (!value) return ''
  const all = parts.formatToParts(value)
  const get = (type: string) => all.find((part) => part.type === type)?.value
  const day = `${get('year')}-${get('month')}-${get('day')}`
  return withTime ? `${day}T${get('hour')}:${get('minute')}` : day
}

export function fromSaoPauloInput(value: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?$/.exec(value.trim())
  if (!match) return null
  const parsed = new Date(`${match[1]}T${match[2] ?? '00:00'}:00${OFFSET}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
