import { formatCpf } from '@/lib/cpf'
import { formatBRL } from '@/lib/money'
import { formatPhone } from '@/lib/phone'
import { html } from './html'
import { emailDocument, heading, orderDetails, type EmailOrder } from './layout'

export function adminNewOrderEmail(order: EmailOrder) {
  const customer = order.customer
  const subject = `Novo pedido pago ${order.number} · ${formatBRL(order.totals.totalCents)}`
  return {
    subject,
    html: emailDocument(
      subject,
      html`${heading('Novo pedido pago')}
        <p style="color:#ccc;font-size:14px;line-height:1.6">
          <strong style="color:#fff">${order.number}</strong><br />${customer.name} ·
          ${customer.email}<br />Telefone ${formatPhone(customer.phone)} · CPF
          ${formatCpf(customer.cpf)}
        </p>
        <p style="color:#ccc;font-size:13px">
          Frete escolhido: ${order.shipping.name} (${order.shipping.company}). Compre a etiqueta no
          painel do Melhor Envio.
        </p>
        ${orderDetails(order)}`,
    ),
  }
}
