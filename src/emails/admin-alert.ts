import { html } from './html'
import { emailDocument, heading } from './layout'

export function adminAlertEmail(input: { orderNumber: string; message: string }) {
  const subject = `Alerta no pedido ${input.orderNumber}`
  return {
    subject,
    html: emailDocument(
      subject,
      html`${heading('Atenção')}
        <p style="color:#ccc;font-size:14px;line-height:1.6">${input.message}</p>`,
    ),
  }
}
