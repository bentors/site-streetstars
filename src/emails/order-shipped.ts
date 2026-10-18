import { html } from './html'
import { emailDocument, heading, orderDetails, type EmailOrder } from './layout'

type Tracking = { carrier: string; code: string; url: string | null }

const button = (href: string, label: string) =>
  html`<a
    href="${href}"
    style="display:inline-block;background:#fff;color:#000;padding:14px 24px;font-size:12px;font-weight:900;letter-spacing:.2em;text-decoration:none;text-transform:uppercase"
    >${label}</a
  >`

export function orderShippedEmail(order: EmailOrder & { tracking: Tracking }, orderUrl: string) {
  const firstName = order.customer.name.trim().split(/\s+/)[0] ?? ''
  const subject = `Pedido ${order.number} enviado`
  return {
    subject,
    html: emailDocument(
      subject,
      html`${heading('Seu pedido está a caminho')}
        <p style="color:#ccc;font-size:14px;line-height:1.6">
          Oi, ${firstName}! O pedido <strong style="color:#fff">${order.number}</strong> foi enviado
          pelos ${order.tracking.carrier}. Código de rastreio:
          <strong style="color:#fff;font-family:monospace">${order.tracking.code}</strong>
        </p>
        <p style="margin:28px 0">
          ${order.tracking.url ? button(order.tracking.url, 'Rastrear entrega') : null}
        </p>
        <p style="font-size:12px"><a href="${orderUrl}" style="color:#ccc">Ver o pedido</a></p>
        ${orderDetails(order)}`,
    ),
  }
}
