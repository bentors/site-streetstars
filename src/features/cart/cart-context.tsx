'use client'

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import {
  addLine,
  CART_STORAGE_KEY,
  cartCount,
  changeLineQty,
  parseCart,
  removeLine,
  serializeCart,
  setLineQty,
  type CartLine,
} from '@/lib/cart'

type CartContextValue = {
  lines: CartLine[]
  count: number
  isOpen: boolean
  open: () => void
  close: () => void
  add: (item: Omit<CartLine, 'qty'>, qty?: number) => void
  setQty: (key: string, qty: number) => void
  changeQty: (key: string, delta: number) => void
  remove: (key: string) => void
  removeKeys: (keys: string[]) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

// ── Armazenamento: localStorage, ou memória se o navegador bloquear ──────────
const listeners = new Set<() => void>()
let memory: string | null = null

function readRaw(): string | null {
  try {
    return localStorage.getItem(CART_STORAGE_KEY)
  } catch {
    return memory
  }
}

function writeLines(lines: CartLine[]) {
  const raw = serializeCart(lines)
  try {
    localStorage.setItem(CART_STORAGE_KEY, raw)
  } catch {
    memory = raw
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const serverSnapshot = () => null

function update(change: (lines: CartLine[]) => CartLine[]) {
  const current = parseCart(readRaw())
  const next = change(current)
  if (serializeCart(next) !== serializeCart(current)) writeLines(next)
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, serverSnapshot)
  const lines = useMemo(() => parseCart(raw), [raw])
  const [isOpen, setIsOpen] = useState(false)

  const add = useCallback((item: Omit<CartLine, 'qty'>, qty = 1) => {
    update((current) => addLine(current, item, qty))
    setIsOpen(true)
  }, [])
  const setQty = useCallback((key: string, qty: number) => {
    update((current) => setLineQty(current, key, qty))
  }, [])
  const changeQty = useCallback((key: string, delta: number) => {
    update((current) => changeLineQty(current, key, delta))
  }, [])
  const remove = useCallback((key: string) => {
    update((current) => removeLine(current, key))
  }, [])
  const removeKeys = useCallback((keys: string[]) => {
    update((current) => keys.reduce(removeLine, current))
  }, [])
  const clear = useCallback(() => {
    update(() => [])
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQty,
      changeQty,
      remove,
      removeKeys,
      clear,
    }),
    [lines, isOpen, add, setQty, changeQty, remove, removeKeys, clear],
  )

  return <CartContext value={value}>{children}</CartContext>
}

export function useCart(): CartContextValue {
  const cart = use(CartContext)
  if (!cart) throw new Error('useCart deve ser usado dentro de CartProvider')
  return cart
}
