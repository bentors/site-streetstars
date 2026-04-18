# Firestore Schema — Street Stars

## users/{uid}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| email | string | sim | |
| name | string | sim | |
| phone | string | não | |
| cpf | string | não | obrigatório no checkout |
| marketingConsent | boolean | sim | registrado no cadastro |
| marketingConsentDate | timestamp | sim | registrado no cadastro |
| created_at | timestamp | sim | |

### users/{uid}/addresses/{addressId}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| label | string | sim | ex: "Casa", "Trabalho" |
| cep | string | sim | |
| street | string | sim | |
| number | string | sim | |
| complement | string | não | |
| neighborhood | string | sim | |
| city | string | sim | |
| state | string | sim | |
| isDefault | boolean | sim | |

---

## orders/{orderId}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| userId | string | sim | uid do comprador |
| status | string | sim | pending, paid, processing, shipped, delivered, cancelled |
| total | number | sim | |
| created_at | timestamp | sim | |
| updated_at | timestamp | sim | |
| address | object | sim | snapshot do endereço no momento da compra |
| payment.provider | string | sim | "mercadopago" |
| payment.preferenceId | string | sim | retornado pela Cloud Function |
| payment.paymentId | string | não | preenchido pelo webhook |
| payment.method | string | não | preenchido pelo webhook |

### orders/{orderId}/items/{itemId}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| productId | string | sim | |
| name | string | sim | snapshot do nome no momento da compra |
| price | number | sim | snapshot do preço no momento da compra |
| quantity | number | sim | |
| size | string | sim | |
| color | string | não | |

---

## admins/{uid}
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| isAdmin | boolean | sim | criado manualmente via console |

---

## Regras de status de pedido
pending → paid → processing → shipped → delivered
qualquer status → cancelled

## Observações
- Snapshots de endereço e itens são imutáveis após criação do pedido
- Status só pode ser alterado via Cloud Function (Admin SDK)
- CPF é opcional no cadastro mas obrigatório antes de finalizar o checkout
- marketingConsent deve ser registrado com timestamp para conformidade LGPD
- Items do pedido permitem create por usuário autenticado, update e delete são bloqueados