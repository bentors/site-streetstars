import { html } from './html'
import { emailDocument, heading, orderDetails, type EmailOrder } from './layout'

export function orderConfirmationEmail(order: EmailOrder, orderUrl: string) {
  const { productionDays, deliveryDays } = order.shipping
  const firstName = order.customer.name.trim().split(/\s+/)[0] ?? ''
  const subject = `Pedido ${order.number} confirmado`
  return {
    subject,
    html: emailDocument(
      subject,
      html`${heading('Pagamento confirmado')}
        <p style="color:#ccc;font-size:14px;line-height:1.6">
          Oi, ${firstName}! Recebemos o pagamento do pedido
          <strong style="color:#fff">${order.number}</strong>. Cada peça é produzida sob demanda: o
          prazo estimado é de até ${productionDays + deliveryDays} dias úteis (${productionDays} de
          produção + ${deliveryDays} de entrega).
        </p>
        <p style="margin:28px 0">
          <a
            href="${orderUrl}"
            style="display:inline-block;background:#fff;color:#000;padding:14px 24px;font-size:12px;font-weight:900;letter-spacing:.2em;text-decoration:none;text-transform:uppercase"
            >Acompanhar pedido</a
          >
        </p>
        ${orderDetails(order)}`,
    ),
  }
}
