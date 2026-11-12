/** JSON seguro para <script type="application/ld+json">: "<" vira <. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
