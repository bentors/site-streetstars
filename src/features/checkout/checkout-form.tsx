'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Button, Checkbox, Field, Select, Spinner, TextField } from '@/components/ui'
import { priceCartAction } from '@/features/cart/actions'
import { useCart } from '@/features/cart/cart-context'
import { OrderSummary } from '@/features/orders/order-summary'
import type { SavedAddress } from '@/lib/account'
import { formatCep, normalizeCep } from '@/lib/cep'
import { checkoutAddressSchema, checkoutCustomerSchema, type ShippingOption } from '@/lib/checkout'
import { formatCpf } from '@/lib/cpf'
import { fieldErrors } from '@/lib/form-errors'
import { formatBRL } from '@/lib/money'
import { redirectTo } from '@/lib/navigate'
import { formatPhone } from '@/lib/phone'
import type { PricedCart } from '@/server/domain/cart-pricing'
import type { AppliedCoupon } from '@/server/domain/coupons'
import {
  createOrderAction,
  lookupCepAction,
  previewCouponAction,
  quoteShippingAction,
} from './actions'
import { AddressFields, EMPTY_ADDRESS, type AddressValues } from './address-fields'

export type CheckoutDefaults = { email: string; name: string; phone: string; cpf: string }

type Contact = CheckoutDefaults
type Address = AddressValues
type Errors = Partial<Record<keyof Contact | keyof Address, string>>
type Notices = { shipping?: string; coupon?: string; form?: string }

const UNEXPECTED = 'Algo deu errado. Tente novamente.'

function validate(contact: Contact, address: Address): Errors {
  const results = [
    checkoutCustomerSchema.safeParse(contact),
    checkoutAddressSchema.safeParse(address),
  ]
  return Object.assign(
    {},
    ...results.map((result) => (result.success ? {} : fieldErrors(result.error))),
  ) as Errors
}

function fieldsOf(saved: SavedAddress): Address {
  const { street, number, complement, neighborhood, city, state } = saved
  return { cep: formatCep(saved.cep), street, number, complement, neighborhood, city, state }
}

const addressLabel = (saved: SavedAddress) =>
  `${saved.label || `${saved.street}, ${saved.number}`} · ${formatCep(saved.cep)}`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 text-sm font-black tracking-widest uppercase italic">{title}</legend>
      {children}
    </fieldset>
  )
}

export function CheckoutForm({
  defaults,
  addresses = [],
  signedIn = false,
}: {
  defaults: CheckoutDefaults
  addresses?: SavedAddress[]
  signedIn?: boolean
}) {
  const initial = addresses.find((saved) => saved.isDefault) ?? addresses[0]
  const { lines, removeKeys, clear } = useCart()
  const [contact, setContact] = useState<Contact>(() => ({
    ...defaults,
    phone: formatPhone(defaults.phone),
    cpf: formatCpf(defaults.cpf),
  }))
  const [address, setAddress] = useState<Address>(() =>
    initial ? fieldsOf(initial) : EMPTY_ADDRESS,
  )
  const [savedId, setSavedId] = useState(initial?.id ?? '')
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0)
  const [errors, setErrors] = useState<Errors>({})
  const [notices, setNotices] = useState<Notices>({})
  const [priced, setPriced] = useState<PricedCart | null>(null)
  const [cartVersion, setCartVersion] = useState(0)
  const [options, setOptions] = useState<ShippingOption[] | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const [loadingCart, startCart] = useTransition()
  const [quoting, startQuote] = useTransition()
  const [applying, startCoupon] = useTransition()
  const [submitting, startSubmit] = useTransition()
  const request = useRef(0)
  // Mesma tentativa (clique duplo, erro de rede) reaproveita a chave; pedido diferente ganha outra.
  const attempt = useRef<{ key: string; payload: string } | null>(null)

  const notify = (patch: Notices) => setNotices((current) => ({ ...current, ...patch }))

  // Preço sempre do servidor. Se a sacola muda, frete e cupom calculados antes não valem mais.
  useEffect(() => {
    if (lines.length === 0) return
    const id = ++request.current
    startCart(async () => {
      try {
        const result = await priceCartAction(lines)
        if (id !== request.current) return
        setPriced(result)
        setOptions(null)
        setServiceId(null)
        setCoupon(null)
        if (result.removedKeys.length > 0) {
          removeKeys(result.removedKeys)
          setNotices({ form: 'Alguns itens não estão mais disponíveis e foram removidos.' })
        }
      } catch {
        if (id === request.current) setNotices({ form: 'Não foi possível carregar a sacola.' })
      }
    })
  }, [lines, cartVersion, removeKeys])

  /** `lookup` só para CEP digitado: endereço salvo ou já preenchido não é trocado pelo ViaCEP. */
  function quote(cep: string, lookup = true) {
    startQuote(async () => {
      try {
        const [found, quoted] = await Promise.all([
          lookup ? lookupCepAction(cep) : null,
          quoteShippingAction(cep, lines),
        ])
        if (found) {
          // CEP de cidade inteira vem sem rua e bairro: não apaga o que o cliente digitou.
          if (found.ok) {
            const filled = Object.entries(found.data).filter(([, value]) => value)
            setAddress((current) => ({ ...current, ...Object.fromEntries(filled) }))
          }
          setErrors((current) => ({
            ...current,
            cep: found.ok || found.code === 'cep_unavailable' ? undefined : found.message,
          }))
        }
        setOptions(quoted.ok ? quoted.data : null)
        setServiceId(
          quoted.ok && quoted.data.length === 1 ? (quoted.data[0]?.serviceId ?? null) : null,
        )
        notify({ shipping: quoted.ok ? undefined : quoted.message })
      } catch {
        notify({ shipping: 'Frete indisponível no momento. Tente novamente.' })
      }
    })
  }

  function chooseSaved(id: string) {
    setSavedId(id)
    const saved = addresses.find((candidate) => candidate.id === id)
    setAddress(saved ? fieldsOf(saved) : EMPTY_ADDRESS)
    setOptions(null)
    setServiceId(null)
    if (saved) quote(saved.cep, false)
  }

  function onCepChange(value: string) {
    setAddress((current) => ({ ...current, cep: formatCep(value) }))
    setOptions(null)
    setServiceId(null)
    const cep = normalizeCep(value)
    if (cep.length === 8) quote(cep)
  }

  function applyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    startCoupon(async () => {
      try {
        const result = await previewCouponAction(code, lines)
        setCoupon(result.ok ? result.data : null)
        notify({ coupon: result.ok ? undefined : result.message })
      } catch {
        notify({ coupon: UNEXPECTED })
      }
    })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validate(contact, address)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify({ form: 'Confira os campos destacados.' })
      return
    }
    if (serviceId === null) {
      notify({ form: 'Escolha uma opção de frete.' })
      return
    }

    const order = { lines, customer: contact, address, serviceId, couponCode: coupon?.code ?? null }
    const payload = JSON.stringify(order)
    if (attempt.current?.payload !== payload) {
      attempt.current = { key: crypto.randomUUID(), payload }
    }
    const idempotencyKey = attempt.current.key
    notify({ form: undefined })

    startSubmit(async () => {
      try {
        // saveAddress fica fora do payload: mudar só o checkbox não cria outro pedido.
        const result = await createOrderAction({
          ...order,
          idempotencyKey,
          saveAddress: signedIn && saveAddress,
        })
        if (result.ok) {
          setRedirecting(true)
          clear()
          redirectTo(result.data.redirectUrl)
          return
        }
        notify({ form: result.message })
        if (result.code === 'cart_changed') setCartVersion((version) => version + 1)
        if (result.code === 'shipping_changed') {
          setOptions(null)
          setServiceId(null)
        }
        if (result.code.startsWith('coupon_')) setCoupon(null)
      } catch {
        notify({ form: UNEXPECTED })
      }
    })
  }

  if (redirecting) {
    return (
      <p role="status" className="py-16 text-center text-xs tracking-widest text-muted uppercase">
        Abrindo o pagamento…
      </p>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-xs tracking-widest text-muted uppercase">Sua sacola está vazia.</p>
        <Link href="/#shop" className="text-xs tracking-widest uppercase underline">
          Ver produtos
        </Link>
      </div>
    )
  }

  const subtotal = priced?.subtotalCents ?? 0
  const discount = Math.min(coupon?.discountCents ?? 0, subtotal)
  const shipping = options?.find((option) => option.serviceId === serviceId) ?? null
  const cepComplete = normalizeCep(address.cep).length === 8

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-12">
        <Section title="1. Contato">
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={contact.email}
            error={errors.email}
            onValue={(email) => setContact((current) => ({ ...current, email }))}
          />
          <TextField
            label="Nome completo"
            autoComplete="name"
            value={contact.name}
            error={errors.name}
            onValue={(name) => setContact((current) => ({ ...current, name }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Telefone"
              type="tel"
              autoComplete="tel-national"
              value={contact.phone}
              error={errors.phone}
              onValue={(phone) =>
                setContact((current) => ({ ...current, phone: formatPhone(phone) }))
              }
            />
            <TextField
              label="CPF"
              inputMode="numeric"
              value={contact.cpf}
              error={errors.cpf}
              onValue={(cpf) => setContact((current) => ({ ...current, cpf: formatCpf(cpf) }))}
            />
          </div>
        </Section>

        <Section title="2. Entrega">
          {addresses.length > 0 ? (
            <Field label="Endereço salvo">
              {(control) => (
                <Select
                  {...control}
                  value={savedId}
                  onChange={(event) => chooseSaved(event.target.value)}
                >
                  {addresses.map((saved) => (
                    <option key={saved.id} value={saved.id}>
                      {addressLabel(saved)}
                    </option>
                  ))}
                  <option value="">Outro endereço</option>
                </Select>
              )}
            </Field>
          ) : null}
          <AddressFields
            value={address}
            errors={errors}
            onChange={(patch) => setAddress((current) => ({ ...current, ...patch }))}
            onCepChange={onCepChange}
          />
          {signedIn ? (
            <Checkbox
              checked={saveAddress}
              onChange={(event) => setSaveAddress(event.target.checked)}
              label="Salvar este endereço na minha conta"
            />
          ) : null}
        </Section>

        <Section title="3. Frete">
          {quoting ? <Spinner size="sm" /> : null}
          {notices.shipping ? (
            <p role="alert" className="font-mono text-[10px] text-danger">
              {notices.shipping}
            </p>
          ) : null}
          {options === null && !quoting ? (
            cepComplete ? (
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => quote(normalizeCep(address.cep), false)}
              >
                Calcular frete
              </Button>
            ) : (
              <p className="text-xs text-muted">Informe o CEP para calcular o frete.</p>
            )
          ) : null}
          {options?.map((option) => (
            <label
              key={option.serviceId}
              className="flex cursor-pointer items-start gap-3 border border-line p-4 has-checked:border-paper"
            >
              <input
                type="radio"
                name="shipping"
                className="mt-1 accent-paper"
                checked={serviceId === option.serviceId}
                onChange={() => setServiceId(option.serviceId)}
              />
              <span className="flex flex-1 flex-col gap-1 text-xs">
                <span className="flex justify-between font-bold tracking-widest uppercase">
                  <span>
                    {option.name}
                    {option.company ? ` · ${option.company}` : ''}
                  </span>
                  <span>{formatBRL(option.priceCents)}</span>
                </span>
                <span className="text-muted">
                  Até {option.totalDays} dias úteis ({option.productionDays} de produção +{' '}
                  {option.deliveryDays} de entrega)
                </span>
              </span>
            </label>
          ))}
        </Section>

        <Section title="4. Cupom">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField
                label="Cupom"
                autoCapitalize="characters"
                value={couponInput}
                onValue={setCouponInput}
              />
            </div>
            <Button variant="secondary" loading={applying} onClick={applyCoupon}>
              Aplicar
            </Button>
          </div>
          {notices.coupon ? (
            <p role="alert" className="font-mono text-[10px] text-danger">
              {notices.coupon}
            </p>
          ) : null}
          {coupon ? (
            <p className="text-xs text-muted">
              Cupom {coupon.code} aplicado.{' '}
              <button
                type="button"
                className="underline hover:text-paper"
                onClick={() => setCoupon(null)}
              >
                Remover
              </button>
            </p>
          ) : null}
        </Section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
        <OrderSummary
          items={priced?.lines ?? []}
          loading={loadingCart}
          subtotalCents={subtotal}
          discountCents={discount}
          couponCode={coupon?.code ?? null}
          shippingCents={shipping?.priceCents ?? null}
        />
        {notices.form ? (
          <p role="alert" className="border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            {notices.form}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={submitting} disabled={!priced}>
          Ir para o pagamento
        </Button>
        <p className="text-[10px] text-muted">
          Pagamento com Pix ou cartão no ambiente seguro do Mercado Pago.
        </p>
      </aside>
    </form>
  )
}
