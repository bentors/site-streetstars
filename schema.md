# Firestore Schema — Street Stars

## users/{uid}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| email | string | sim | |
| name | string | sim | |
| phone | string | não | |
| cpf | string | não | obrigatório antes do primeiro checkout |
| marketingConsent | boolean | sim | registrado no cadastro |
| marketingConsentDate | timestamp | sim | registrado no cadastro — conformidade LGPD |
| created_at | timestamp | sim | |

### users/{uid}/addresses/{addressId}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| label | string | sim | ex: "Casa", "Trabalho" |
| cep | string | sim | armazenado sem formatação (8 dígitos) |
| street | string | sim | |
| number | string | sim | |
| complement | string | não | |
| neighborhood | string | sim | |
| city | string | sim | |
| state | string | sim | sigla UF |
| isDefault | boolean | sim | |

---

## orders/{orderId}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| userId | string | sim | uid do comprador |
| status | string | sim | ver fluxo de status abaixo |
| total | number | sim | recalculado pelo servidor em `createPayment` |
| created_at | timestamp | sim | |
| updated_at | timestamp | sim | atualizado a cada mudança de status |
| address | object | sim | snapshot do endereço no momento da compra (imutável) |
| shipping.id | number | sim | id do serviço Melhor Envio |
| shipping.name | string | sim | ex: "PAC", "SEDEX" |
| shipping.price | number | sim | em BRL |
| shipping.delivery_time | number | sim | dias úteis estimados |
| shipping.company | string | sim | ex: "Correios" |
| payment.provider | string | sim | `"mercadopago"` |
| payment.preferenceId | string | não | preenchido por `createPayment` |
| payment.paymentId | string | não | preenchido pelo webhook |
| payment.method | string | não | preenchido pelo webhook (ex: `"credit_card"`) |

### orders/{orderId}/items/{itemId}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| productId | string | sim | referência ao produto original |
| name | string | sim | snapshot do nome no momento da compra (imutável) |
| price | number | sim | snapshot do preço — validado pelo servidor em `createPayment` |
| quantity | number | sim | |
| size | string | sim | ex: "M", "GG" |
| color | string | não | null se produto sem variante de cor |
| img | string | não | URL Cloudinary do produto |

---

## admins/{uid}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| isAdmin | boolean | sim | criado manualmente via Firebase Console |

> **Atenção:** a verificação de admin em rotas protegidas usa **Custom Claims** do Firebase Auth
> (`idTokenResult.claims.admin === true`), não este documento. A collection `admins/` serve
> apenas como referência humana de quem tem acesso.

---

## Fluxo de status de pedido

```
pending → paid → processing → shipped → delivered
   ↓          ↓        ↓          ↓
cancelled  cancelled cancelled  cancelled
```

| Status | Responsável pela transição |
|---|---|
| `pending` | criado pelo front-end no checkout |
| `paid` | webhook do Mercado Pago via `mpWebhook.js` |
| `processing` | alterado manualmente pelo admin no Dashboard |
| `shipped` | alterado manualmente pelo admin no Dashboard |
| `delivered` | alterado manualmente pelo admin no Dashboard |
| `cancelled` | webhook MP (rejeição/cancelamento) ou ação admin |

---

## Regras de segurança do Firestore (resumo)

| Coleção | Leitura | Escrita |
|---|---|---|
| `products` | pública | apenas admin (custom claim) |
| `users/{uid}` | apenas o próprio usuário | apenas o próprio usuário |
| `users/{uid}/addresses` | apenas o próprio usuário | apenas o próprio usuário |
| `orders/{orderId}` | dono do pedido ou admin | dono do pedido (criação) / Admin SDK (updates de status) |
| `orders/{orderId}/items` | dono do pedido ou admin | dono do pedido (criação) — update e delete bloqueados |
| `admins` | apenas admin | apenas Admin SDK |

> As regras completas devem ser mantidas no arquivo `firestore.rules` na raiz do projeto.
> **Nunca confie apenas nas regras do Firestore** — o servidor sempre re-valida ownership
> e preços antes de processar pagamentos.

---

## Observações de segurança e conformidade

- `price` nos itens do pedido é **snapshot de segurança**: o valor real é re-validado pelo servidor
  em `createPayment.js` consultando o catálogo — o cliente não pode alterar preços.
- `userId` em `orders` é definido pelo front-end na criação, mas verificado contra o token
  autenticado pelo servidor em `createPayment.js` antes de qualquer processamento.
- `cpf` é armazenado em plain text. Para conformidade LGPD em escala, considere criptografia
  em repouso (AES-256) ou uso de tokenização antes de armazenar.
- `marketingConsent` deve sempre ser acompanhado de `marketingConsentDate` para evidência
  de consentimento conforme Art. 8º da LGPD.