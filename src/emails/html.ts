const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

/** HTML já montado por `html`: não é escapado de novo quando interpolado. */
export class SafeHtml {
  constructor(readonly value: string) {}
}

type Value = string | number | SafeHtml | null | undefined | false | Value[]

function render(value: Value): string {
  if (value === null || value === undefined || value === false) return ''
  if (value instanceof SafeHtml) return value.value
  if (Array.isArray(value)) return value.map(render).join('')
  return escapeHtml(String(value))
}

/** Template de e-mail seguro por padrão: todo valor interpolado é escapado. */
export function html(strings: TemplateStringsArray, ...values: Value[]): SafeHtml {
  return new SafeHtml(
    strings.reduce(
      (out, chunk, i) => out + chunk + (i < values.length ? render(values[i]) : ''),
      '',
    ),
  )
}
