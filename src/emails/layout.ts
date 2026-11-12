import { formatCep } from '@/lib/cep'
import { formatBRL } from '@/lib/money'
import type { OrderDoc } from '@/server/db/orders'
import { html, type SafeHtml } from './html'

export type EmailOrder = Pick<
  OrderDoc,
  'number' | 'customer' | 'items' | 'totals' | 'shipping' | 'shippingAddress' | 'coupon'
>

export function emailDocument(title: string, body: SafeHtml): string {
  return html`<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>${title}</title>
      </head>
      <body style="margin:0;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif">
        <div style="max-width:560px;margin:0 auto;padding:40px 20px">
          <p
            style="margin:0 0 32px;font-size:20px;font-weight:900;font-style:italic;letter-spacing:.1em;text-transform:uppercase"
          >
            Street Stars ★
          </p>
          ${body}
          <p style="margin-top:40px;color:#666;font-size:11px">
            Street Stars · streetwear produzido sob demanda
          </p>
        </div>
      </body>
    </html>`.value
}

export function heading(text: string): SafeHtml {
  return html`<h1 style="margin:0 0 12px;font-size:22px;font-style:italic;text-transform:uppercase">
    ${text}
  </h1>`
}

function row(label: string, value: string): SafeHtml {
  return html`<tr>
    <td style="padding:4px 0;color:#999">${label}</td>
    <td style="padding:4px 0;text-align:right">${value}</td>
  </tr>`
}

export function orderDetails(order: EmailOrder): SafeHtml {
  const address = order.shippingAddress
  return html` <table style="width:100%;margin-top:24px;border-collapse:collapse;font-size:13px">
      ${order.items.map(
        (item) =>
          html`<tr>
            <td style="padding:8px 0;border-bottom:1px solid #222">
              ${item.name}<br /><span style="color:#999;font-size:11px"
                >Tam. ${item.size}${item.color ? ` · ${item.color}` : ''} · Qtd. ${item.qty}</span
              >
            </td>
            <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right">
              ${formatBRL(item.lineTotalCents)}
            </td>
          </tr>`,
      )}
    </table>
    <table style="width:100%;margin-top:12px;font-size:13px">
      ${row('Subtotal', formatBRL(order.totals.subtotalCents))}
      ${order.coupon ? row(`Cupom ${order.coupon.code}`, `− ${formatBRL(order.totals.discountCents)}`) : null}
      ${row(`Frete (${order.shipping.name})`, formatBRL(order.totals.shippingCents))}
      <tr>
        <td style="padding-top:8px;font-weight:700">Total</td>
        <td style="padding-top:8px;text-align:right;font-weight:700">
          ${formatBRL(order.totals.totalCents)}
        </td>
      </tr>
    </table>
    <p style="margin-top:24px;color:#ccc;font-size:13px;line-height:1.6">
      <strong style="color:#fff">Entrega</strong><br />
      ${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ''}<br />
      ${address.neighborhood} · ${address.city}/${address.state} · CEP ${formatCep(address.cep)}
    </p>`
}
