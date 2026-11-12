import type { ProductDoc } from '@/lib/catalog-schemas'
import type { OrderDoc } from '@/server/db/orders'

export const NOW = new Date('2026-10-04T12:00:00.000Z')

export function productDoc(overrides: Partial<ProductDoc> = {}): ProductDoc {
  return {
    slug: 'camiseta',
    name: 'Camiseta',
    description: 'Algodão',
    category: 'SUPERIORES',
    priceCents: 14990,
    weightGrams: 250,
    productionDays: 10,
    sizes: ['P', 'M'],
    colors: [{ name: 'Preto', hex: '#000000', image: null }],
    images: [
      { url: 'https://res.cloudinary.com/x/image/upload/a.jpg', publicId: 'a', alt: 'Camiseta' },
    ],
    highlights: [],
    sizeGuide: null,
    collectionIds: [],
    status: 'active',
    featured: false,
    featuredOrder: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export function orderDoc(overrides: Partial<OrderDoc> = {}): OrderDoc {
  return {
    number: 'SS-1001',
    idempotencyKey: '00000000-0000-4000-8000-000000000001',
    customer: {
      uid: null,
      email: 'ana@exemplo.com',
      name: 'Ana Souza',
      phone: '11987654321',
      cpf: '52998224725',
    },
    items: [
      {
        productId: 'p1',
        slug: 'camiseta',
        name: 'Camiseta',
        image: 'https://res.cloudinary.com/x/image/upload/a.jpg',
        size: 'M',
        color: 'Preto',
        unitPriceCents: 14990,
        qty: 2,
        lineTotalCents: 29980,
      },
    ],
    shippingAddress: {
      cep: '20040002',
      street: 'Rua da Assembleia',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    shipping: {
      serviceId: 1,
      name: 'PAC',
      company: 'Correios',
      priceCents: 2500,
      deliveryDays: 8,
      productionDays: 10,
    },
    coupon: null,
    totals: { subtotalCents: 29980, discountCents: 0, shippingCents: 2500, totalCents: 32480 },
    status: 'pending_payment',
    statusHistory: [{ status: 'pending_payment', at: NOW, by: 'system' }],
    payment: {
      preferenceId: null,
      paymentId: null,
      status: null,
      method: null,
      paidAmountCents: null,
      paidAt: null,
    },
    tracking: null,
    notifications: { confirmationSentAt: null, shippedSentAt: null, adminAlertSentAt: null },
    adminSeenAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: new Date(NOW.getTime() + 48 * 60 * 60 * 1000),
    ...overrides,
  }
}
