import { describe, expect, it } from 'vitest'
import { jsonLdString } from './json-ld'

describe('jsonLdString', () => {
  it('escapa < para não fechar a tag script', () => {
    const out = jsonLdString({ name: 'Camiseta </script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c/script>')
    expect(JSON.parse(out)).toEqual({ name: 'Camiseta </script><script>alert(1)</script>' })
  })
})
