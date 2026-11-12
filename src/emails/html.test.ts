import { describe, expect, it } from 'vitest'
import { escapeHtml, html } from './html'

describe('html', () => {
  it('escapa os valores interpolados', () => {
    expect(html`<p>${'<b>"Ana" & \'Bia\'</b>'}</p>`.value).toBe(
      '<p>&lt;b&gt;&quot;Ana&quot; &amp; &#39;Bia&#39;&lt;/b&gt;</p>',
    )
  })

  it('não escapa de novo o que já é html seguro, aceita listas e ignora vazios', () => {
    const items = ['a', '<b>'].map((item) => html`<li>${item}</li>`)
    // prettier-ignore
    const rendered = html`<ul>${items}</ul>${null}${undefined}${false}${42}`.value
    expect(rendered).toBe('<ul><li>a</li><li>&lt;b&gt;</li></ul>42')
  })

  it('escapeHtml', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })
})
